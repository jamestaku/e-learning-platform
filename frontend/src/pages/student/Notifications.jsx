import API_URL from "../../api";
import { useEffect, useState } from "react";

function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    // ================================
    // FETCH NOTIFICATIONS
    // ================================

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/api/notifications`,
                {
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to load notifications"
                );
            }

            setNotifications(
                data.notifications || []
            );

        } catch (error) {
            console.error(
                "Fetch notifications error:",
                error
            );

            setError(error.message);

        } finally {
            setLoading(false);
        }
    };

    // ================================
    // MARK ONE AS READ
    // ================================

    const markAsRead = async (id) => {
        try {
            const response = await fetch(
                `${API_URL}/api/notifications/${id}/read`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

            if (!response.ok) {
                return;
            }

            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === id
                        ? {
                            ...notification,
                            is_read: true
                        }
                        : notification
                )
            );

        } catch (error) {
            console.error(
                "Mark notification read error:",
                error
            );
        }
    };

    // ================================
    // MARK ALL AS READ
    // ================================

    const markAllAsRead = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/notifications/read-all`,
                {
                    method: "PUT",
                    headers: {
                        Authorization:
                            "Bearer " + token
                    }
                }
            );

            if (!response.ok) {
                return;
            }

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    is_read: true
                }))
            );

        } catch (error) {
            console.error(
                "Mark all notifications error:",
                error
            );
        }
    };

    // ================================
    // GET NOTIFICATION ICON
    // ================================

    const getNotificationIcon = (type) => {

        switch (type) {

            case "assignment":
                return "📝";

            case "grade":
                return "🎓";

            case "message":
                return "💬";

            case "course":
                return "📚";

            case "submission":
                return "📄";

            case "general":
                return "🔔";

            default:
                return "🔔";
        }
    };

    // ================================
    // INITIAL LOAD
    // ================================

    useEffect(() => {
        fetchNotifications();
    }, []);

    const unreadCount = notifications.filter(
        (notification) =>
            !notification.is_read
    ).length;

    return (
        <div className="notifications-container">

            {/* HEADER */}

            <div className="notifications-header">

                <div>
                    <h1>Notifications</h1>

                    <p>
                        Stay updated with your
                        learning activities.
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        className="mark-all-read-btn"
                        onClick={markAllAsRead}
                    >
                        ✓ Mark all as read
                    </button>
                )}

            </div>


            {/* ERROR */}

            {error && (
                <div className="notifications-error">
                    {error}
                </div>
            )}


            {/* LOADING */}

            {loading && (
                <div className="notifications-loading">
                    Loading notifications...
                </div>
            )}


            {/* EMPTY */}

            {!loading &&
                notifications.length === 0 && (

                    <div className="notifications-empty">

                        <div className="notifications-empty-icon">
                            🔔
                        </div>

                        <h2>
                            No notifications
                        </h2>

                        <p>
                            You're all caught up!
                        </p>

                    </div>
                )}


            {/* NOTIFICATIONS */}

            {!loading &&
                notifications.length > 0 && (

                    <div className="notifications-list">

                        {notifications.map(
                            (notification) => (

                                <div
                                    key={
                                        notification.id
                                    }
                                    className={`notification-item ${
                                        !notification.is_read
                                            ? "unread"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        !notification.is_read &&
                                        markAsRead(
                                            notification.id
                                        )
                                    }
                                >

                                    {/* ICON */}

                                    <div className="notification-icon">

                                        {getNotificationIcon(
                                            notification.type
                                        )}

                                    </div>


                                    {/* CONTENT */}

                                    <div className="notification-content">

                                        <div className="notification-top">

                                            <h3>
                                                {
                                                    notification.title
                                                }
                                            </h3>

                                            {!notification.is_read && (
                                                <span className="notification-new">
                                                    New
                                                </span>
                                            )}

                                        </div>


                                        <p>
                                            {
                                                notification.message
                                            }
                                        </p>


                                        <span className="notification-date">

                                            📅{" "}
                                            {new Date(
                                                notification.created_at
                                            ).toLocaleString()}

                                        </span>

                                    </div>


                                    {/* UNREAD DOT */}

                                    {!notification.is_read && (

                                        <div className="notification-unread-dot">
                                            ●
                                        </div>

                                    )}

                                </div>

                            )
                        )}

                    </div>
                )}

        </div>
    );
}

export default Notifications;