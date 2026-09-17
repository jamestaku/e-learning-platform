import API_URL from "../../api";
import { useEffect, useState } from "react";

function Messages() {
    const [activeTab, setActiveTab] = useState("inbox");

    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);

    const [selectedMessage, setSelectedMessage] = useState(null);

    const [teachers, setTeachers] = useState([]);

    const [showCompose, setShowCompose] = useState(false);

    const [receiverId, setReceiverId] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const [sending, setSending] = useState(false);
    const [sendStatus, setSendStatus] = useState("");

    const token = localStorage.getItem("token");

    // ================================
    // FETCH INBOX
    // ================================

    const fetchInbox = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/messages/inbox`,
                {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setInbox(data.messages || []);
            }
        } catch (error) {
            console.error("Fetch inbox error:", error);
        }
    };

    // ================================
    // FETCH SENT MESSAGES
    // ================================

    const fetchSent = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/messages/sent`,
                {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSent(data.messages || []);
            }
        } catch (error) {
            console.error("Fetch sent messages error:", error);
        }
    };

    // ================================
    // FETCH TEACHERS
    // ================================

    const fetchTeachers = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/users/teachers`,
                {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setTeachers(data.teachers || []);
            }
        } catch (error) {
            console.error("Fetch teachers error:", error);
        }
    };

    // ================================
    // INITIAL LOAD
    // ================================

    useEffect(() => {
        fetchInbox();
        fetchSent();
        fetchTeachers();
    }, []);

    // ================================
    // OPEN MESSAGE
    // ================================

    const openMessage = async (messageId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/messages/${messageId}`,
                {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSelectedMessage(data.message);

                // Refresh inbox because opening the message
                // marks it as read
                fetchInbox();
            }
        } catch (error) {
            console.error("Open message error:", error);
        }
    };

    // ================================
    // SEND MESSAGE
    // ================================

    const sendMessage = async (e) => {
        e.preventDefault();

        setSendStatus("");

        if (!receiverId) {
            setSendStatus("Please select a teacher.");
            return;
        }

        if (!message.trim()) {
            setSendStatus("Please enter a message.");
            return;
        }

        setSending(true);

        try {
            const response = await fetch(
                `${API_URL}/api/messages`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token
                    },

                    body: JSON.stringify({
                        receiver_id: receiverId,
                        subject: subject,
                        message: message
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setSendStatus(
                    data.message || "Failed to send message."
                );

                setSending(false);
                return;
            }

            setSendStatus("Message sent successfully.");

            // Clear form
            setReceiverId("");
            setSubject("");
            setMessage("");

            // Refresh sent messages
            await fetchSent();

            // Automatically switch to Sent
            setActiveTab("sent");

            // Close compose after a short delay
            setTimeout(() => {
                setShowCompose(false);
                setSendStatus("");
            }, 1200);

        } catch (error) {
            console.error("Send message error:", error);

            setSendStatus(
                "Unable to send message. Please try again."
            );
        }

        setSending(false);
    };

    // ================================
    // UNREAD COUNT
    // ================================

    const unreadCount = inbox.filter(
        (msg) => !msg.is_read
    ).length;

    return (
        <div className="messages-container">

            {/* PAGE HEADER */}

            <div className="messages-header">

                <div>
                    <h2>Messages</h2>

                    <p>
                        Communicate with your teachers
                    </p>
                </div>

                <button
                    className="compose-message-btn"
                    onClick={() => {
                        setShowCompose(true);
                        setSelectedMessage(null);
                        setSendStatus("");
                    }}
                >
                    ✉️ Compose Message
                </button>

            </div>

            {/* COMPOSE MESSAGE */}

            {showCompose && (
                <div className="compose-message-card">

                    <div className="compose-header">

                        <h3>
                            Compose Message
                        </h3>

                        <button
                            className="close-compose-btn"
                            onClick={() => {
                                setShowCompose(false);
                                setSendStatus("");
                            }}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={sendMessage}>

                        {/* TEACHER */}

                        <div className="form-group">

                            <label>
                                To
                            </label>

                            <select
                                value={receiverId}
                                onChange={(e) =>
                                    setReceiverId(
                                        e.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Select a teacher
                                </option>

                                {teachers.map((teacher) => (
                                    <option
                                        key={teacher.id}
                                        value={teacher.id}
                                    >
                                        {teacher.full_name} (
                                        {teacher.email})
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* SUBJECT */}

                        <div className="form-group">

                            <label>
                                Subject
                            </label>

                            <input
                                type="text"
                                value={subject}
                                onChange={(e) =>
                                    setSubject(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter message subject"
                            />

                        </div>

                        {/* MESSAGE */}

                        <div className="form-group">

                            <label>
                                Message
                            </label>

                            <textarea
                                value={message}
                                onChange={(e) =>
                                    setMessage(
                                        e.target.value
                                    )
                                }
                                placeholder="Write your message..."
                                rows="6"
                            />

                        </div>

                        {/* STATUS */}

                        {sendStatus && (
                            <div
                                className={
                                    sendStatus.includes(
                                        "successfully"
                                    )
                                        ? "message-success"
                                        : "message-error"
                                }
                            >
                                {sendStatus}
                            </div>
                        )}

                        {/* BUTTONS */}

                        <div className="compose-actions">

                            <button
                                type="button"
                                className="cancel-message-btn"
                                onClick={() => {
                                    setShowCompose(false);
                                    setSendStatus("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="send-message-btn"
                                disabled={sending}
                            >
                                {sending
                                    ? "Sending..."
                                    : "📤 Send Message"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {/* TABS */}

            <div className="messages-tabs">

                <button
                    className={
                        activeTab === "inbox"
                            ? "active"
                            : ""
                    }
                    onClick={() => {
                        setActiveTab("inbox");
                        setSelectedMessage(null);
                    }}
                >
                    📥 Inbox

                    {unreadCount > 0 && (
                        <span className="unread-badge">
                            {unreadCount}
                        </span>
                    )}

                </button>

                <button
                    className={
                        activeTab === "sent"
                            ? "active"
                            : ""
                    }
                    onClick={() => {
                        setActiveTab("sent");
                        setSelectedMessage(null);
                    }}
                >
                    📤 Sent
                </button>

            </div>

            {/* MESSAGE AREA */}

            <div className="messages-content">

                {/* MESSAGE LIST */}

                <div className="message-list">

                    {(activeTab === "inbox"
                        ? inbox
                        : sent
                    ).length === 0 ? (

                        <div className="no-messages">
                            <div className="no-messages-icon">
                                📭
                            </div>

                            <h3>
                                No messages
                            </h3>

                            <p>
                                You don't have any{" "}
                                {activeTab} messages yet.
                            </p>
                        </div>

                    ) : (

                        (activeTab === "inbox"
                            ? inbox
                            : sent
                        ).map((msg) => (

                            <div
                                key={msg.id}
                                className={`message-item ${
                                    !msg.is_read &&
                                    activeTab === "inbox"
                                        ? "unread"
                                        : ""
                                }`}
                                onClick={() =>
                                    openMessage(msg.id)
                                }
                            >

                                <div className="message-avatar">
                                    {activeTab === "inbox"
                                        ? msg.sender_name
                                              ?.charAt(0)
                                              .toUpperCase()
                                        : msg.receiver_name
                                              ?.charAt(0)
                                              .toUpperCase()}
                                </div>

                                <div className="message-info">

                                    <div className="message-top">

                                        <strong>
                                            {activeTab ===
                                            "inbox"
                                                ? msg.sender_name
                                                : msg.receiver_name}
                                        </strong>

                                        <span>
                                            {new Date(
                                                msg.created_at
                                            ).toLocaleDateString()}
                                        </span>

                                    </div>

                                    <h4>
                                        {msg.subject ||
                                            "(No subject)"}
                                    </h4>

                                    <p>
                                        {msg.message}
                                    </p>

                                </div>

                            </div>

                        ))

                    )}

                </div>

                {/* MESSAGE VIEWER */}

                {selectedMessage && (

                    <div className="message-viewer">

                        <div className="message-viewer-header">

                            <div>

                                <h3>
                                    {selectedMessage.subject ||
                                        "(No subject)"}
                                </h3>

                                <p>
                                    {activeTab === "inbox"
                                        ? `From: ${selectedMessage.sender_name}`
                                        : `To: ${selectedMessage.receiver_name}`}
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setSelectedMessage(null)
                                }
                            >
                                ×
                            </button>

                        </div>

                        <div className="message-meta">

                            <span>
                                📅{" "}
                                {new Date(
                                    selectedMessage.created_at
                                ).toLocaleString()}
                            </span>

                            <span>
                                ✉️{" "}
                                {activeTab === "inbox"
                                    ? selectedMessage.sender_email
                                    : selectedMessage.receiver_email}
                            </span>

                        </div>

                        <div className="message-body">

                            {selectedMessage.message}

                        </div>

                    </div>

                )}

            </div>

        </div>
    );
}

export default Messages;