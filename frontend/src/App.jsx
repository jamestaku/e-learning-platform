import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";

import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";

import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherCourses from "./pages/teacher/Courses";
import StudentCourses from "./pages/student/Courses";
import TeacherLessons from "./pages/teacher/Lessons";
import StudentCourseLearning from "./pages/student/CourseLearning";
import TeacherAssignments from "./pages/teacher/Assignments";
import StudentAssignments from "./pages/student/Assignments";
import TeacherSubmissions from "./pages/teacher/Submissions";
import StudentGrades from "./pages/student/Grades";
import StudentMessages from "./pages/student/Messages";
import TeacherMessages from "./pages/teacher/Messages";
import TeacherStudents from "./pages/teacher/Students";
import StudentNotifications from "./pages/student/Notifications";
import TeacherNotifications from "./pages/teacher/Notifications";
import Settings from "./pages/Settings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import AdminSettings from "./pages/admin/AdminSettings";
function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* Authentication */}

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* Teacher */}

      <Route
    path="/teacher"
    element={
        <ProtectedRoute role="teacher">
            <TeacherLayout />
        </ProtectedRoute>
    }
>
    <Route index element={<TeacherDashboard />} />
    <Route path="courses" element={<TeacherCourses />} />
    <Route path="lessons" element={<TeacherLessons />} />
    <Route path="assignments" element={<TeacherAssignments />} />
    <Route path="submissions" element={<TeacherSubmissions />} />
    <Route path="messages" element={<TeacherMessages />} />
    <Route path="students" element={<TeacherStudents />} />
    <Route path="notifications" element={<TeacherNotifications />} />
    <Route path="settings" element={<Settings />} />
</Route>

    


                {/* Student */}

           {/* Student */}

<Route
    path="/student"
    element={
        <ProtectedRoute role="student">
            <StudentLayout />
        </ProtectedRoute>
    }
>
    <Route index element={<StudentDashboard />} />

    <Route
        path="courses"
        element={<StudentCourses />}
    />

    <Route
        path="courses/:courseId"
        element={<StudentCourseLearning />}
    />
    <Route
        path="assignments"
        element={<StudentAssignments />}
    />
    <Route path="grades" element={<StudentGrades />} /> 
    <Route path="messages" element={<StudentMessages />} /> 
    <Route path="notifications" element={<StudentNotifications />} />
    <Route path="settings" element={<Settings />} />
</Route>

 {/* Admin */}
<Route
    path="/admin"
    element={
        <ProtectedRoute role="admin">
            <AdminLayout />
        </ProtectedRoute>
    }
>
    <Route index element={<AdminDashboard />} />
    <Route path="users" element={<Users />} />
    <Route path="settings" element={<AdminSettings />} />
</Route>
 


            </Routes>

        </BrowserRouter>
    );
}

export default App;