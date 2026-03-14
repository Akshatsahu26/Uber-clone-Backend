export const getwelcome = async (req, res) => {
    try {
        const { userId } = req.params;
        const authenticateUser = req.user; //Form auth middleware

        if(authenticateUser._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can access your own profile"
            })
        }

        return res.status(200).json({
            success: true,
            message: `Welcome ${authenticateUser.name}`,
            data: {
                userId: authenticateUser._id,
                name: authenticateUser.name,
                email: authenticateUser.email,
                role: authenticateUser.role,
                welcomeMessage: `Hello ${authenticateUser.name}, Welcome to Uber Clone!`,
            }
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get welcome message",
        })
    }
}