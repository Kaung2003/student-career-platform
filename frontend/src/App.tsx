import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import { UiProvider } from "./context/UiContext";
import { ChatProvider } from "./context/ChatContext";
import { AdminRoute, OptionalAuthRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Projects } from "./pages/Projects";
import { Certifications } from "./pages/Certifications";
import { InterviewPractice } from "./pages/InterviewPractice";
import { Feedback } from "./pages/Feedback";
import { PublicPortfolio } from "./pages/PublicPortfolio";
import { Directory } from "./pages/Directory";
import { Landing } from "./pages/Landing";
import { NotFound } from "./pages/NotFound";
import { Assistant } from "./pages/Assistant";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminFeedback } from "./pages/admin/AdminFeedback";
import { AdminQuestions } from "./pages/admin/AdminQuestions";
import { AdminComments } from "./pages/admin/AdminComments";

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <UiProvider>
          <AuthProvider>
            <ChatProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/p/:slug" element={<PublicPortfolio />} />

                <Route element={<OptionalAuthRoute />}>
                  <Route path="/directory" element={<Directory />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/certifications" element={<Certifications />} />
                  <Route path="/interview" element={<InterviewPractice />} />
                  <Route path="/feedback" element={<Feedback />} />
                </Route>

                <Route path="/admin" element={<AdminRoute />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="feedback" element={<AdminFeedback />} />
                  <Route path="questions" element={<AdminQuestions />} />
                  <Route path="comments" element={<AdminComments />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ChatProvider>
          </AuthProvider>
        </UiProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
