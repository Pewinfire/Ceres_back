class HttpError extends Error{
    constructor(message, errorCode) {
        super(message); //mensaje identificativo del error
        this.code= errorCode; // codigo identificativo del error
    }
}

module.exports = HttpError;