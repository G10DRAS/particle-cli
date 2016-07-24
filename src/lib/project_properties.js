const promisefs = require('es6-promisify-all')(require('fs'));
import path from 'path';

const legacy = 'legacy';
const simple = 'simple';
const extended = 'extended';

export default class ProjectProperties {
	constructor(dir, { filename = 'project.properties', fs = promisefs } = {}) {
		this.dir = dir;
		this.fs = fs;
		this.filename = filename;
		this.fields = {};
	}

	name() {
		return path.join(this.dir, this.filename);
	}

	load() {
		return this.fs.readFileAsync(this.name(), 'utf8')
			.then(data => this.parse(data));
	}

	parse(data) {
		this.fields = data.split('\n')
			.reduce((obj, line) => {
				const [field, value] = line.split('=');
				if (value !== undefined) {
					obj[field] = value;
				}
				return obj;
			}, {});
	}

	save() {
		const data = this.serialize();
		return this.fs.writeFileAsync(this.name(), data, 'utf8');
	}

	serialize() {
		return Object.keys(this.fields).map(field => {
			return `${field}=${this.fields[field]}`;
		}).join('\n')+'\n';
	}

	exists() {
		const stat = this.fs.statAsync(this.name());
		return stat.then(stats => {
			return stats.isFile();
		},
		err => {
			return false;
		});
	}

	sourceDirExists() {
		const stat = this.fs.statAsync(path.join(this.dir, 'src'));
		return stat.then(stats => stats.isDirectory(), () => false);
	}

	projectLayout() {
		return this.exists()
			.then((exists) => {
				if (exists) {
					return this.sourceDirExists()
						.then((exists) => exists ? extended : simple);
				} else {
					return legacy;
				}
			});
	}

	addDependency(name, version) {
		this.fields[this.dependencyField(name)] = version;
	}

	dependencyField(name) {
		return `dependencies.${name}`;
	}

	libraryDirectory(vendored, libName) {
		if (!vendored) {
			throw new Error('non-vendored library install not yet supported. Come back later.');
		}
		const relative = vendored ? 'lib' : '.lib';
		return path.join(this.dir, relative, libName);
	}
}


export {
	legacy, simple, extended
};
