// Mock for pdfjs-dist module to avoid ESM import issues in Jest
module.exports = {
    getDocument: () => ({
        promise: Promise.resolve({
            numPages: 1,
            getPage: () => Promise.resolve({
                getTextContent: () => Promise.resolve({
                    items: [{
                        str: 'Mocked PDF text content'
                    }]
                })
            })
        })
    })
};