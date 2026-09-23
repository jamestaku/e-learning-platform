import API_URL from "../../api";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function Users() {

    const [searchParams] = useSearchParams();

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ========================================
    // GET TOKEN
    // ========================================

    const token = localStorage.getItem("token");


    // ========================================
    // READ ROLE FILTER FROM URL
    // ========================================

    useEffect(() => {

        const role = searchParams.get("role");

        if (role === "teacher" || role === "student") {

            setRoleFilter(role);

        } else {

            setRoleFilter("all");

        }

    }, [searchParams]);


    // ========================================
    // LOAD USERS
    // ========================================

    const fetchUsers = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/users/admin/all`,
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
                    data.message || "Failed to load users"
                );

            }

            setUsers(data.users || []);

        } catch (error) {

            console.error(
                "Fetch users error:",
                error
            );

            setError(error.message);

        } finally {

            setLoading(false);

        }

    };


    // ========================================
    // LOAD USERS WHEN PAGE OPENS
    // ========================================

    useEffect(() => {

        fetchUsers();

    }, []);


    // ========================================
    // CHANGE USER STATUS
    // ========================================

    const changeStatus = async (userId, status) => {

        const action =
            status === "active"
                ? "activate"
                : "deactivate";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} this user?`
        );

        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/users/admin/${userId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status: status
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    `Failed to ${action} user`
                );

            }

            // Update the user immediately
            setUsers((currentUsers) =>
                currentUsers.map((user) =>
                    user.id === userId
                        ? {
                            ...user,
                            status: status
                        }
                        : user
                )
            );

        } catch (error) {

            console.error(
                "Change status error:",
                error
            );

            alert(error.message);

        }

    };


    // ========================================
    // DELETE USER
    // ========================================

    const deleteUser = async (userId, userName) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete ${userName}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/users/admin/${userId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to delete user"
                );

            }

            // Remove user from the table
            setUsers((currentUsers) =>
                currentUsers.filter(
                    (user) => user.id !== userId
                )
            );

        } catch (error) {

            console.error(
                "Delete user error:",
                error
            );

            alert(error.message);

        }

    };


    // ========================================
    // FILTER USERS
    // ========================================

    const filteredUsers = users.filter((user) => {

        const searchText =
            search.toLowerCase().trim();

        const matchesSearch =
            user.full_name
                .toLowerCase()
                .includes(searchText) ||

            user.email
                .toLowerCase()
                .includes(searchText);

        const matchesRole =
            roleFilter === "all" ||
            user.role === roleFilter;

        const matchesStatus =
            statusFilter === "all" ||
            user.status === statusFilter;

        return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
        );

    });


    // ========================================
    // LOADING
    // ========================================

    if (loading) {

        return (
            <div className="container-fluid p-4">

                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: "300px" }}
                >

                    <div className="text-center">

                        <div
                            className="spinner-border text-primary mb-3"
                            role="status"
                        >
                        </div>

                        <p className="text-muted">
                            Loading users...
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

            {/* Page Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Users Management
                    </h2>

                    <p className="text-muted mb-0">
                        Manage teachers and students
                    </p>

                </div>

                <button
                    className="btn btn-outline-primary"
                    onClick={fetchUsers}
                >
                    <i className="fas fa-sync-alt me-2"></i>
                    Refresh
                </button>

            </div>


            {/* Error */}

            {error && (

                <div
                    className="alert alert-danger"
                    role="alert"
                >
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                </div>

            )}


            {/* Statistics */}

            <div className="row g-3 mb-4">

                {/* Total Users */}

                <div className="col-md-4">

                    <div className="card border-0 shadow-sm">

                        <div className="card-body">

                            <div className="d-flex justify-content-between">

                                <div>

                                    <p className="text-muted mb-1">
                                        Total Users
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {users.length}
                                    </h3>

                                </div>

                                <div className="text-primary fs-2">
                                    <i className="fas fa-users"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Teachers */}

                <div className="col-md-4">

                    <div className="card border-0 shadow-sm">

                        <div className="card-body">

                            <div className="d-flex justify-content-between">

                                <div>

                                    <p className="text-muted mb-1">
                                        Teachers
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {
                                            users.filter(
                                                user =>
                                                    user.role === "teacher"
                                            ).length
                                        }
                                    </h3>

                                </div>

                                <div className="text-success fs-2">
                                    <i className="fas fa-chalkboard-teacher"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* Students */}

                <div className="col-md-4">

                    <div className="card border-0 shadow-sm">

                        <div className="card-body">

                            <div className="d-flex justify-content-between">

                                <div>

                                    <p className="text-muted mb-1">
                                        Students
                                    </p>

                                    <h3 className="fw-bold mb-0">
                                        {
                                            users.filter(
                                                user =>
                                                    user.role === "student"
                                            ).length
                                        }
                                    </h3>

                                </div>

                                <div className="text-info fs-2">
                                    <i className="fas fa-user-graduate"></i>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* Search and Filters */}

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body">

                    <div className="row g-3">

                        {/* Search */}

                        <div className="col-md-6">

                            <label className="form-label fw-semibold">
                                Search Users
                            </label>

                            <div className="input-group">

                                <span className="input-group-text">
                                    <i className="fas fa-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                />

                            </div>

                        </div>


                        {/* Role */}

                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                Role
                            </label>

                            <select
                                className="form-select"
                                value={roleFilter}
                                onChange={(e) =>
                                    setRoleFilter(e.target.value)
                                }
                            >

                                <option value="all">
                                    All Roles
                                </option>

                                <option value="teacher">
                                    Teachers
                                </option>

                                <option value="student">
                                    Students
                                </option>

                            </select>

                        </div>


                        {/* Status */}

                        <div className="col-md-3">

                            <label className="form-label fw-semibold">
                                Status
                            </label>

                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >

                                <option value="all">
                                    All Status
                                </option>

                                <option value="active">
                                    Active
                                </option>

                                <option value="inactive">
                                    Inactive
                                </option>

                            </select>

                        </div>

                    </div>

                </div>

            </div>


            {/* Users Table */}

            <div className="card border-0 shadow-sm">

                <div className="card-header bg-white py-3">

                    <div className="d-flex justify-content-between align-items-center">

                        <h5 className="mb-0 fw-bold">
                            {roleFilter === "teacher"
                                ? "Teachers"
                                : roleFilter === "student"
                                    ? "Students"
                                    : "All Users"
                            }
                        </h5>

                        <span className="badge bg-secondary">
                            {filteredUsers.length} users
                        </span>

                    </div>

                </div>


                <div className="card-body p-0">

                    {filteredUsers.length === 0 ? (

                        <div className="text-center py-5">

                            <i className="fas fa-users-slash fs-1 text-muted mb-3"></i>

                            <h5>
                                No users found
                            </h5>

                            <p className="text-muted mb-0">
                                Try changing your search or filters.
                            </p>

                        </div>

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle mb-0">

                                <thead className="table-light">

                                    <tr>

                                        <th className="px-4">
                                            #
                                        </th>

                                        <th>
                                            User
                                        </th>

                                        <th>
                                            Email
                                        </th>

                                        <th>
                                            Role
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Registered
                                        </th>

                                        <th className="text-center">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredUsers.map(
                                        (user, index) => (

                                            <tr key={user.id}>

                                                <td className="px-4">
                                                    {index + 1}
                                                </td>


                                                <td>

                                                    <div className="d-flex align-items-center">

                                                        <div
                                                            className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-3"
                                                            style={{
                                                                width: "42px",
                                                                height: "42px"
                                                            }}
                                                        >
                                                            <i className="fas fa-user"></i>
                                                        </div>

                                                        <div>

                                                            <div className="fw-semibold">
                                                                {user.full_name}
                                                            </div>

                                                        </div>

                                                    </div>

                                                </td>


                                                <td>
                                                    {user.email}
                                                </td>


                                                <td>

                                                    {user.role === "teacher" ? (

                                                        <span className="badge bg-success">

                                                            <i className="fas fa-chalkboard-teacher me-1"></i>

                                                            Teacher

                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-info">

                                                            <i className="fas fa-user-graduate me-1"></i>

                                                            Student

                                                        </span>

                                                    )}

                                                </td>


                                                <td>

                                                    {user.status === "active" ? (

                                                        <span className="badge bg-success">

                                                            <i className="fas fa-check-circle me-1"></i>

                                                            Active

                                                        </span>

                                                    ) : (

                                                        <span className="badge bg-secondary">

                                                            <i className="fas fa-times-circle me-1"></i>

                                                            Inactive

                                                        </span>

                                                    )}

                                                </td>


                                                <td>

                                                    {user.created_at
                                                        ? new Date(
                                                            user.created_at
                                                        ).toLocaleDateString()
                                                        : "—"
                                                    }

                                                </td>


                                                <td>

                                                    <div className="d-flex justify-content-center gap-2">

                                                        {user.status === "active" ? (

                                                            <button
                                                                className="btn btn-sm btn-outline-warning"
                                                                title="Deactivate user"
                                                                onClick={() =>
                                                                    changeStatus(
                                                                        user.id,
                                                                        "inactive"
                                                                    )
                                                                }
                                                            >
                                                                <i className="fas fa-user-slash"></i>
                                                            </button>

                                                        ) : (

                                                            <button
                                                                className="btn btn-sm btn-outline-success"
                                                                title="Activate user"
                                                                onClick={() =>
                                                                    changeStatus(
                                                                        user.id,
                                                                        "active"
                                                                    )
                                                                }
                                                            >
                                                                <i className="fas fa-user-check"></i>
                                                            </button>

                                                        )}


                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Delete user"
                                                            onClick={() =>
                                                                deleteUser(
                                                                    user.id,
                                                                    user.full_name
                                                                )
                                                            }
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Users;