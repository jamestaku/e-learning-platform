import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {

    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    // Not logged in
    if (!token || !userData) {
        return <Navigate to="/login" replace />;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return <Navigate to="/login" replace />;
    }

    // Wrong role
    if (role && user.role !== role) {

        if (user.role === "admin") {
            return <Navigate to="/admin" replace />;
        }

        if (user.role === "teacher") {
            return <Navigate to="/teacher" replace />;
        }

        if (user.role === "student") {
            return <Navigate to="/student" replace />;
        }

        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;