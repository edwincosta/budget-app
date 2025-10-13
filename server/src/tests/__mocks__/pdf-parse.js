// Mock for pdf-parse module to avoid ESM import issues in Jest
module.exports = function pdfParse() {
    return Promise.resolve({
        text: 'Mocked PDF content for testing',
        numpages: 1,
        numrender: 0,
        info: {},
        metadata: {},
        version: '1.0.0'
    });
};