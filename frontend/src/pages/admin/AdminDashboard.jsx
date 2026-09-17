import { useEffect, useState } from "react";

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

    useEffect(() => {

        const fetchStats = async () => {

            try {

                const token = localStorage.getItem("token");

                const response = await fetch(
                    "http://localhost:5000/api/admin/stats",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to load statistics"
                    );
                }

                setStats(data.stats);

            } catch (error) {

                console.error(
                    "Dashboard statistics error:",
                    error
                );

                setError(error.message);

            } finally {

                setLoading(false);
            }
        };

        fetchStats();

    }, []);


    if (loading) {

        return (
            <div className="text-center py-5">

                <div
                    className="spinner-border text-primary"
                    role="status"
                ></div>

                <p className="mt-3 text-muted">
                    Loading dashboard...
                </p>

            </div>
        );
    }


    if (error) {

        return (
            <div>

                <h2 className="mb-4">
                    Admin Dashboard
                </h2>

                <div className="alert alert-danger">
                    {error}
                </div>

            </div>
        );
    }


    const userPercentage =
        stats.total_users > 0
            ? Math.round(
                (stats.total_teachers / stats.total_users) * 100
            )
            : 0;


    const studentPercentage =
        stats.total_users > 0
            ? Math.round(
                (stats.total_students / stats.total_users) * 100
            )
            : 0;


    const activePercentage =
        stats.total_users > 0
            ? Math.round(
                (stats.active_users / stats.total_users) * 100
            )
            : 0;


    return (
        <div>

            {/* ========================= */}
            {/* PAGE HEADER */}
            {/* ========================= */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Admin Dashboard
                    </h2>

                    <p className="text-muted mb-0">
                        Manage and monitor your e-learning platform.
                    </p>

                </div>

                <div className="text-end">

                    <span className="badge bg-success px-3 py-2">
                        <i className="bi bi-circle-fill me-2"></i>
                        System Online
                    </span>

                </div>

            </div>


            {/* ========================= */}
            {/* STATISTICS CARDS */}
            {/* ========================= */}

            <div className="row g-4 mb-4">

                {/* Total Users */}

                <div className="col-xl-3 col-md-6">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <p className="text-muted mb-1">
                                        Total Users
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.total_users}
                                    </h2>

                                </div>

                                <div
                                    className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "55px",
                                        height: "55px"
                                    }}
                                >

                                    <i className="bi bi-people fs-4"></i>

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


                {/* Teachers */}

                <div className="col-xl-3 col-md-6">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <p className="text-muted mb-1">
                                        Teachers
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.total_teachers}
                                    </h2>

                                </div>

                                <div
                                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "55px",
                                        height: "55px"
                                    }}
                                >

                                    <i className="bi bi-person-workspace fs-4"></i>

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


                {/* Students */}

                <div className="col-xl-3 col-md-6">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <p className="text-muted mb-1">
                                        Students
                                    </p>

                                    <h2 className="fw-bold mb-0">
                                        {stats.total_students}
                                    </h2>

                                </div>

                                <div
                                    className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "55px",
                                        height: "55px"
                                    }}
                                >

                                    <i className="bi bi-mortarboard fs-4"></i>

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


                {/* Active Users */}

                <div className="col-xl-3 col-md-6">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body">

                            <div className="d-flex justify-content-between align-items-center">

                                <div>

                                    <p className="text-muted mb-1">
                                        Active Users
                                    </p>

                                    <h2 className="fw-bold mb-0 text-success">
                                        {stats.active_users}
                                    </h2>

                                </div>

                                <div
                                    className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                        width: "55px",
                                        height: "55px"
                                    }}
                                >

                                    <i className="bi bi-person-check fs-4"></i>

                                </div>

                            </div>

                            <div className="mt-3">

                                <small className="text-muted">
                                    Currently active
                                </small>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ========================= */}
            {/* MAIN DASHBOARD CONTENT */}
            {/* ========================= */}

            <div className="row g-4">

                {/* User Overview */}

                <div className="col-lg-8">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <div className="d-flex justify-content-between align-items-center mb-4">

                                <div>

                                    <h5 className="fw-bold mb-1">
                                        User Overview
                                    </h5>

                                    <small className="text-muted">
                                        Distribution of platform users
                                    </small>

                                </div>

                                <i className="bi bi-bar-chart-line fs-4 text-primary"></i>

                            </div>


                            {/* Teachers */}

                            <div className="mb-4">

                                <div className="d-flex justify-content-between mb-2">

                                    <span>
                                        <i className="bi bi-person-workspace me-2 text-success"></i>
                                        Teachers
                                    </span>

                                    <strong>
                                        {stats.total_teachers}
                                    </strong>

                                </div>

                                <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                >

                                    <div
                                        className="progress-bar bg-success"
                                        style={{
                                            width: `${userPercentage}%`
                                        }}
                                    ></div>

                                </div>

                            </div>


                            {/* Students */}

                            <div className="mb-4">

                                <div className="d-flex justify-content-between mb-2">

                                    <span>
                                        <i className="bi bi-mortarboard me-2 text-info"></i>
                                        Students
                                    </span>

                                    <strong>
                                        {stats.total_students}
                                    </strong>

                                </div>

                                <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                >

                                    <div
                                        className="progress-bar bg-info"
                                        style={{
                                            width: `${studentPercentage}%`
                                        }}
                                    ></div>

                                </div>

                            </div>


                            {/* Active Users */}

                            <div>

                                <div className="d-flex justify-content-between mb-2">

                                    <span>
                                        <i className="bi bi-check-circle me-2 text-success"></i>
                                        Active Users
                                    </span>

                                    <strong>
                                        {stats.active_users}
                                    </strong>

                                </div>

                                <div
                                    className="progress"
                                    style={{ height: "10px" }}
                                >

                                    <div
                                        className="progress-bar bg-success"
                                        style={{
                                            width: `${activePercentage}%`
                                        }}
                                    ></div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Account Status */}

                <div className="col-lg-4">

                    <div className="card border-0 shadow-sm h-100">

                        <div className="card-body p-4">

                            <h5 className="fw-bold mb-4">
                                Account Status
                            </h5>


                            <div className="text-center mb-4">

                                <div
                                    className="rounded-circle border border-5 border-success d-flex flex-column align-items-center justify-content-center mx-auto"
                                    style={{
                                        width: "150px",
                                        height: "150px"
                                    }}
                                >

                                    <h2 className="fw-bold mb-0">
                                        {activePercentage}%
                                    </h2>

                                    <small className="text-muted">
                                        Active
                                    </small>

                                </div>

                            </div>


                            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">

                                <span>
                                    <span className="badge bg-success me-2">
                                        &nbsp;
                                    </span>
                                    Active
                                </span>

                                <strong>
                                    {stats.active_users}
                                </strong>

                            </div>


                            <div className="d-flex justify-content-between align-items-center">

                                <span>
                                    <span className="badge bg-danger me-2">
                                        &nbsp;
                                    </span>
                                    Inactive
                                </span>

                                <strong>
                                    {stats.inactive_users}
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* ========================= */}
            {/* QUICK ACTIONS */}
            {/* ========================= */}

            <div className="card border-0 shadow-sm mt-4">

                <div className="card-body p-4">

                    <h5 className="fw-bold mb-4">
                        Quick Actions
                    </h5>

                    <div className="row g-3">

                        <div className="col-md-4">

                            <a
                                href="/admin/users"
                                className="btn btn-primary w-100 py-3"
                            >

                                <i className="bi bi-people me-2"></i>

                                Manage Users

                            </a>

                        </div>


                        <div className="col-md-4">

                            <a
                                href="/admin/users"
                                className="btn btn-outline-success w-100 py-3"
                            >

                                <i className="bi bi-person-check me-2"></i>

                                Manage Teachers

                            </a>

                        </div>


                        <div className="col-md-4">

                            <a
                                href="/admin/users"
                                className="btn btn-outline-info w-100 py-3"
                            >

                                <i className="bi bi-mortarboard me-2"></i>

                                Manage Students

                            </a>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default AdminDashboard;