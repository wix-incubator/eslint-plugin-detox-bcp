const glob = require('glob');
const path = require('path');
const { ESLint } = require('eslint');
const replaceAll = require('string.prototype.replaceall');

function generateSuite(__filename) {
  const cwd = path.dirname(__filename);
  const basename = path.basename(__filename, '.test.js');
  const fixtureTests = glob.sync(`__fixtures__/${basename}/**/*.js`, { cwd });

  describe(`${basename}:`, () => {
    let eslint, formatter;

    beforeAll(async () => {
      eslint = new ESLint({ cwd,  });
      formatter = await eslint.loadFormatter("compact");
    });

    test.each(fixtureTests.map(file => [path.basename(file, '.js'), file]))('%s', async (baseName, filePath) => {
      const absoluteFilePath = path.normalize(path.join(cwd, filePath));
      const results = await eslint.lintFiles([filePath]);
      const rawResultText = await formatter.format(results);
      const envIndependentText = replaceAll(replaceAll(rawResultText, absoluteFilePath, ''), /^: /g, '');
      expect(envIndependentText).toMatchSnapshot();
    });
  });
}

module.exports = generateSuite;
