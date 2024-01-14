# Support Manager API
SUPPORT MANAGER Server

## Installation

```bash
git clone git@github.com/josebozzone/club-galeria-api-2.0.git
cd km-api
npm install
```
* Node Bin PATH
It can is also very helpful to put the project node bin dir in your path.  
Add the following line to your .bashrc:

```
export PATH="./node_modules/.bin:$PATH"
```

## Development

### Setup

The project is configured with a `.editorconfig` to maintain consistent
indentation and end-of-line settings:

* [Atom](https://github.com/sindresorhus/atom-editorconfig#readme)
* [Sublime Text](https://github.com/sindresorhus/editorconfig-sublime#readme)
* [Vim](https://github.com/editorconfig/editorconfig-vim#readme)

### Environment

The project uses a .env file in the project root directory.
Simply copy the .env-example to .env and set your local values. [View the .env-example file for a list of config vars and descriptions](.env-example)

```bash
cp .env-example .env
```

### Database Setup

To setup the database for the first time:

```bash
createdb support_manager
```

or recreate it with the lastest data.  Caution this will delete an existing db.

```bash
gulp db:recreate
```

### Run

In development use gulp start to run the application, npm start will work but gulp start uses nodemon which will restart the server automatically if any source files change.

```bash
# Using gulp start will restart the server if any js files change, very handy in dev
DEBUG=support:* gulp start
```