
import { useEffect, useState } from "react";

function TeacherNotifications() {

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    // ==========================================
    // FETCH NOTIFICATIONS
    // ==========================================

    const fetchNotifications = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/notifications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
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

            setError(
                error.message ||
                "Failed to load notifications"
            );

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // MARK ONE NOTIFICATION AS READ
    // ==========================================

    const markAsRead = async (notificationId) => {

        try {

            const response = await fetch(
                `http://localhost:5000/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to mark notification as read"
                );
            }

            // Update notification locally
            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === notificationId
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


    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    const markAllAsRead = async () => {

        try {

            const response = await fetch(
                "http://localhost:5000/api/notifications/read-all",
                {
                    method: "PUT",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to mark notifications as read"
                );
            }

            // Update locally
            setNotifications((previous) =>
                previous.map((notification) => ({
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


    // ==========================================
    // GET NOTIFICATION ICON
    // ==========================================

    const getNotificationIcon = (type) => {

        switch (type) {

            case "assignment":
                return "📝";

            case "submission":
                return "📤";

            case "grade":
                return "🎓";

            case "message":
                return "💬";

            case "course":
                return "📚";

            case "general":
            default:
                return "🔔";

        }

    };


    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {

        if (!date) {
            return "";
        }

        return new Date(date).toLocaleString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    };


    // ==========================================
    // LOAD NOTIFICATIONS
    // ==========================================

    useEffect(() => {

        fetchNotifications();

    }, []);


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (
            <div className="notifications-container">

                <div className="notifications-loading">
                    Loading notifications...
                </div>

            </div>
        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (
            <div className="notifications-container">

                <div className="notifications-header">

                    <div>
                        <h2>Notifications</h2>

                        <p>
                            Stay updated with activity
                            from your students.
                        </p>
                    </div>

                </div>

                <div className="notifications-error">
                    {error}
                </div>

            </div>
        );

    }


    // ==========================================
    // COUNT UNREAD
    // ==========================================

    const unreadCount =
        notifications.filter(
            (notification) =>
                !notification.is_read
        ).length;


    return (

        <div className="notifications-container">

            {/* ==================================
                HEADER
            ================================== */}

            <div className="notifications-header">

                <div>

                    <h2>
                        Notifications
                    </h2>

                    <p>
                        Stay updated with activity
                        from your students.
                    </p>

                </div>

                {unreadCount > 0 && (

                    <button
                        className="mark-all-read-btn"
                        onClick={markAllAsRead}
                    >
                        Mark all as read
                    </button>

                )}

            </div>


            {/* ==================================
                UNREAD COUNT
            ================================== */}

            {unreadCount > 0 && (

                <div className="notification-unread-summary">

                    You have{" "}
                    <strong>
                        {unreadCount}
                    </strong>{" "}
                    unread notification
                    {unreadCount !== 1 ? "s" : ""}.

                </div>

            )}


            {/* ==================================
                NOTIFICATIONS
            ================================== */}

            {notifications.length === 0 ? (

                <div className="notifications-empty">

                    <div className="notifications-empty-icon">
                        🔔
                    </div>

                    <h3>
                        No notifications
                    </h3>

                    <p>
                        You don't have any
                        notifications yet.
                    </p>

                </div>

            ) : (

                <div className="notifications-list">

                    {notifications.map(
                        (notification) => (

                            <div
                                key={notification.id}
                                className={
                                    `notification-item ${
                                        !notification.is_read
                                            ? "unread"
                                            : ""
                                    }`
                                }
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
                                            {notification.title}
                                        </h3>

                                        <span className="notification-date">

                                            {formatDate(
                                                notification.created_at
                                            )}

                                        </span>

                                    </div>


                                    <p>
                                        {notification.message}
                                    </p>


                                    {!notification.is_read && (

                                        <span className="notification-new">

                                            New

                                        </span>

                                    )}

                                </div>


                                {/* UNREAD DOT */}

                                {!notification.is_read && (

                                    <div className="notification-unread-dot">
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

export default TeacherNotifications;

