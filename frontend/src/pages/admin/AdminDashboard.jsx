import API_URL from "../../api";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function AdminDashboard() {

    const [stats, setStats] = useState({
        total_users: 0,
        total_teachers: 0,
        total_students: 0,
        active_users: 0,
        inactive_users: 0
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");


    // ========================================
    // LOAD ADMIN STATISTICS
    // ========================================

    const fetchStats = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/admin/stats`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load dashboard statistics"
                );

            }

            setStats({
                total_users: data.total_users || 0,
                total_teachers: data.total_teachers || 0,
                total_students: data.total_students || 0,
                active_users: data.active_users || 0,
                inactive_users: data.inactive_users || 0
            });

        } catch (error) {

            console.error(
                "Fetch admin statistics error:",
                error
            );

            setError(error.message);

        } finally {

            setLoading(false);

        }

    };


    // ========================================
    // LOAD STATISTICS WHEN PAGE OPENS
    // ========================================

    useEffect(() => {

        fetchStats();

    }, []);


    // ========================================
    // CALCULATE PERCENTAGES
    // ========================================

    const userPercentage =
        stats.total_users > 0
            ? (stats.total_teachers / stats.total_users) * 100
            : 0;

    const studentPercentage =
        stats.total_users > 0
            ? (stats.total_students / stats.total_users) * 100
            : 0;

    const activePercentage =
        stats.total_users > 0
            ? (stats.active_users / stats.total_users) * 100
            : 0;


    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (

            <div className="container-fluid p-4">

                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "400px" }}
                >

                    <div className="text-center">

                        <div
                            className="spinner-border text-primary mb-3"
                            role="status"
                        >
                        </div>

                        <p className="text-muted mb-0">
                            Loading dashboard...
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    // ========================================
    // PAGE
    // ========================================

    return (

        <div className="container-fluid p-4">

            {/* ========================================
                PAGE HEADER
            ======================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Admin Dashboard
                    </h2>

                    <p className="text-muted mb-0">
                        Overview of your e-learning platform
                    </p>

                </div>

                <button
                    className="btn btn-outline-primary"
                    onClick={fetchStats}
                >
                    <i className="fas fa-sync-alt me-2"></i>
                    Refresh
                </button>

            </div>


            {/* ========================================
                ERROR
            ======================================== */}

            {error && (

                <div
                    className="alert alert-danger"
                    role="alert"
                >

                    <i className="fas fa-exclamation-circle me-2"></i>

                    {error}

                </div>

            )}


            {/* ========================================
                STATISTICS CARDS
            ======================================== */}

            <div className="row g-4 mb-4">


                {/* TOTAL USERS */}

                <div className="col-md-6 col-xl-3">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <div className="d-flex justify-content-between align-items-start">

                                <div>

                                    <p className="text-muted mb-2">
                                        Total Users
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.total_users}
                                    </h2>

                                </div>

                                <div className="text-primary fs-1">
                                    <i className="fas fa-users"></i>
                                </div>

                            </div>

                            <div className="mt-3">

                                <small className="text-muted">
                                    All registered users
                                </small>

                            </div>

                        </div>

                    </div>

                </div>


                {/* TEACHERS */}

                <div className="col-md-6 col-xl-3">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <div className="d-flex justify-content-between align-items-start">

                                <div>

                                    <p className="text-muted mb-2">
                                        Teachers
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.total_teachers}
                                    </h2>

                                </div>

                                <div className="text-success fs-1">
                                    <i className="fas fa-chalkboard-teacher"></i>
                                </div>

                            </div>

                            <div className="mt-3">

                                <small className="text-muted">
                                    Registered teachers
                                </small>

                            </div>

                        </div>

                    </div>

                </div>


                {/* STUDENTS */}

                <div className="col-md-6 col-xl-3">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <div className="d-flex justify-content-between align-items-start">

                                <div>

                                    <p className="text-muted mb-2">
                                        Students
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.total_students}
                                    </h2>

                                </div>

                                <div className="text-info fs-1">
                                    <i className="fas fa-user-graduate"></i>
                                </div>

                            </div>

                            <div className="mt-3">

                                <small className="text-muted">
                                    Registered students
                                </small>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ACTIVE USERS */}

                <div className="col-md-6 col-xl-3">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <div className="d-flex justify-content-between align-items-start">

                                <div>

                                    <p className="text-muted mb-2">
                                        Active Users
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.active_users}
                                    </h2>

                                </div>

                                <div className="text-success fs-1">
                                    <i className="fas fa-user-check"></i>
                                </div>

                            </div>

                            <div className="mt-3">

                                <small className="text-muted">
                                    Currently active accounts
                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ========================================
                USER OVERVIEW + ACCOUNT STATUS
            ======================================== */}

            <div className="row g-4">


                {/* USER OVERVIEW */}

                <div className="col-lg-8">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <h5 className="fw-bold mb-4">
                                User Overview
                            </h5>


                            {/* TEACHERS */}

                            <div className="mb-4">

                                <div className="d-flex justify-content-between mb-2">

                                    <span className="fw-semibold">
                                        Teachers
                                    </span>

                                    <span className="text-muted">
                                        {stats.total_teachers}
                                    </span>

                                </div>

                                <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                >

                                    <div
                                        className="progress-bar bg-success"
                                        role="progressbar"
                                        style={{
                                            width: `${userPercentage}%`
                                        }}
                                    >
                                    </div>

                                </div>

                            </div>


                            {/* STUDENTS */}

                            <div className="mb-4">

                                <div className="d-flex justify-content-between mb-2">

                                    <span className="fw-semibold">
                                        Students
                                    </span>

                                    <span className="text-muted">
                                        {stats.total_students}
                                    </span>

                                </div>

                                <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                >

                                    <div
                                        className="progress-bar bg-info"
                                        role="progressbar"
                                        style={{
                                            width: `${studentPercentage}%`
                                        }}
                                    >
                                    </div>

                                </div>

                            </div>


                            {/* TOTAL USERS */}

                            <div>

                                <div className="d-flex justify-content-between mb-2">

                                    <span className="fw-semibold">
                                        Total Users
                                    </span>

                                    <span className="text-muted">
                                        {stats.total_users}
                                    </span>

                                </div>

                                <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                >

                                    <div
                                        className="progress-bar bg-primary"
                                        role="progressbar"
                                        style={{
                                            width: "100%"
                                        }}
                                    >
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ACCOUNT STATUS */}

                <div className="col-lg-4">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <h5 className="fw-bold mb-4">
                                Account Status
                            </h5>


                            <div className="text-center">

                                <div
                                    className="rounded-circle border border-success border-4 d-flex justify-content-center align-items-center mx-auto mb-3"
                                    style={{
                                        width: "130px",
                                        height: "130px"
                                    }}
                                >

                                    <div>

                                        <h3 className="fw-bold text-success mb-0">
                                            {Math.round(activePercentage)}%
                                        </h3>

                                        <small className="text-muted">
                                            Active
                                        </small>

                                    </div>

                                </div>


                                <div className="row mt-4">

                                    <div className="col-6">

                                        <h5 className="fw-bold text-success">
                                            {stats.active_users}
                                        </h5>

                                        <small className="text-muted">
                                            Active
                                        </small>

                                    </div>


                                    <div className="col-6">

                                        <h5 className="fw-bold text-secondary">
                                            {stats.inactive_users}
                                        </h5>

                                        <small className="text-muted">
                                            Inactive
                                        </small>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ========================================
                QUICK ACTIONS
            ======================================== */}

            <div className="card border-0 shadow-sm mt-4">

                <div className="card-body p-4">

                    <h5 className="fw-bold mb-4">
                        Quick Actions
                    </h5>

                    <div className="row g-3">


                        {/* MANAGE USERS */}

                        <div className="col-md-4">

                            <Link
                                to="/admin/users"
                                className="btn btn-primary w-100 py-3"
                            >

                                <i className="bi bi-people me-2"></i>

                                Manage Users

                            </Link>

                        </div>


                        {/* MANAGE TEACHERS */}

                        <div className="col-md-4">

                            <Link
                                to="/admin/users?role=teacher"
                                className="btn btn-outline-success w-100 py-3"
                            >

                                <i className="bi bi-person-check me-2"></i>

                                Manage Teachers

                            </Link>

                        </div>


                        {/* MANAGE STUDENTS */}

                        <div className="col-md-4">

                            <Link
                                to="/admin/users?role=student"
                                className="btn btn-outline-info w-100 py-3"
                            >

                                <i className="bi bi-mortarboard me-2"></i>

                                Manage Students

                            </Link>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );
}

export default AdminDashboard;