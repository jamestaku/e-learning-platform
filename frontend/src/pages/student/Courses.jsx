
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Courses() {

    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");


    const fetchCourses = async () => {

        try {

            const [coursesResponse, enrolledResponse] =
                await Promise.all([

                    fetch(
                        "http://localhost:5000/api/courses",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    ),

                    fetch(
                        "http://localhost:5000/api/enrollments/my",
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    )

                ]);


            const coursesData =
                await coursesResponse.json();

            const enrolledData =
                await enrolledResponse.json();


            if (!coursesResponse.ok) {

                setMessage(
                    coursesData.message ||
                    "Unable to load courses"
                );

                return;
            }


            if (!enrolledResponse.ok) {

                setMessage(
                    enrolledData.message ||
                    "Unable to load your courses"
                );

                return;
            }


            setCourses(
                coursesData.courses
            );

            setMyCourses(
                enrolledData.courses
            );
            console.log("MY COURSES DATA:", enrolledData.courses);


        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );


        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        fetchCourses();

    }, []);


    const isEnrolled = (courseId) => {

        return myCourses.some(
            (course) =>
                course.course_id === courseId
        );

    };


    const handleEnroll = async (courseId) => {

        setMessage("Enrolling...");


        try {

            const response = await fetch(
                "http://localhost:5000/api/enrollments",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        course_id: courseId
                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                setMessage(
                    data.message ||
                    "Unable to enrol"
                );

                return;
            }


            setMessage(
                "Successfully enrolled in the course!"
            );


            fetchCourses();


        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to connect to the server."
            );

        }

    };


    return (

        <div className="courses-page">


            {/* Page Header */}

            <div className="courses-header">

                <div>

                    <h1>
                        My Courses
                    </h1>

                    <p>
                        Browse available courses and continue
                        your learning journey.
                    </p>

                </div>


                <div className="course-count">

                    <strong>
                        {myCourses.length}
                    </strong>

                    <span>
                        Enrolled
                    </span>

                </div>

            </div>


            {/* Message */}

            {message && (

                <div className="course-message">
                    {message}
                </div>

            )}


            {/* My Enrolled Courses */}

            <div className="courses-section">

                <div className="courses-section-header">

                    <div>

                        <h2>
                            My Enrolled Courses
                        </h2>

                        <p>
                            Courses you are currently enrolled in.
                        </p>

                    </div>

                </div>


                {loading ? (

                    <div className="empty-courses">

                        <p>
                            Loading courses...
                        </p>

                    </div>

                ) : myCourses.length === 0 ? (

                    <div className="empty-courses">

                        <div className="empty-icon">
                            📚
                        </div>

                        <h3>
                            No enrolled courses
                        </h3>

                        <p>
                            Choose a course below to start learning.
                        </p>

                    </div>

                ) : (

                    <div className="course-grid">

                        {myCourses.map((course) => (

                            <div
                                className="course-card"
                                key={course.id}
                            >


                                <div className="course-card-top">

                                    <div className="course-icon">
                                        📚
                                    </div>

                                    <span className="course-status">
                                        Enrolled
                                    </span>

                                </div>


                                <div className="course-card-body">

                                    <h3>
                                        {course.title}
                                    </h3>

                                    <p>
                                        {course.description ||
                                            "No description provided."}
                                    </p>

                                    <p>

                                        <strong>
                                            Teacher:
                                        </strong>{" "}

                                        {course.teacher_name}

                                    </p>

                                </div>


                                <div className="course-card-footer">

                                    <span>

                                        Enrolled{" "}

                                        {new Date(
                                            course.enrolled_at
                                        ).toLocaleDateString()}

                                    </span>


                                   <button
    className="open-course-btn"
    onClick={() => {
        console.log("OPENING COURSE:", course.course_id);
        navigate(`/student/courses/${course.course_id}`);
    }}
>
    Open Course
</button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* Available Courses */}

            <div className="courses-section">

                <div className="courses-section-header">

                    <div>

                        <h2>
                            Available Courses
                        </h2>

                        <p>
                            Explore courses available on EduLearn.
                        </p>

                    </div>

                </div>


                {loading ? (

                    <div className="empty-courses">

                        <p>
                            Loading courses...
                        </p>

                    </div>

                ) : courses.length === 0 ? (

                    <div className="empty-courses">

                        <div className="empty-icon">
                            🎓
                        </div>

                        <h3>
                            No courses available
                        </h3>

                        <p>
                            Check back later for new courses.
                        </p>

                    </div>

                ) : (

                    <div className="course-grid">

                        {courses.map((course) => (

                            <div
                                className="course-card"
                                key={course.id}
                            >


                                <div className="course-card-top">

                                    <div className="course-icon">
                                        🎓
                                    </div>

                                </div>


                                <div className="course-card-body">

                                    <h3>
                                        {course.title}
                                    </h3>

                                    <p>
                                        {course.description ||
                                            "No description provided."}
                                    </p>

                                    <p>

                                        <strong>
                                            Teacher:
                                        </strong>{" "}

                                        {course.teacher_name}

                                    </p>

                                </div>


                                <div className="course-card-footer">

                                    {isEnrolled(course.id) ? (

                                        <span className="course-status">
                                            Already Enrolled
                                        </span>

                                    ) : (

                                        <button
                                            onClick={() =>
                                                handleEnroll(
                                                    course.id
                                                )
                                            }
                                        >
                                            Enrol Now
                                        </button>

                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>

    );

}

export default Courses;

