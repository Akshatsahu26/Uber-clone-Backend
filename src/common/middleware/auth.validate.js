export const validate = (Schema) => {
    return async (req, res, next) => {
        try {
            // debug: log incoming body and content-type for validation
            console.log('Validation middleware content-type:', req.headers['content-type']);
            console.log('Validation middleware body:', JSON.stringify(req.body));
            await Schema.parseAsync({ body: req.body })
            return next();
        } catch (error) {
            console.log("Validation error catch", error)
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: error.errors || error.message
            })
        }
    }
}