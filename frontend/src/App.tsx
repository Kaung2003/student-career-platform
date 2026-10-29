import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { UiProvider } from "./context/UiContext";
import { ChatProvider } from "./context/ChatContext";
import { I18nProvider } from "./i18n/I18nContext";
import { AdminRoute, BareProtectedRoute, OptionalAuthRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Landing } from "./pages/Landing";

// Each page is its own download, so visitors only load the code for the pages they open.
const named = <K extends string>(loader: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => loader().then((m) => ({ default: m[name] })));

const Login = named(() => import("./pages/Login"), "Login");
const Register = named(() => import("./pages/Register"), "Register");
const ForgotPassword = named(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = named(() => import("./pages/ResetPassword"), "ResetPassword");
const VerifyEmail = named(() => import("./pages/VerifyEmail"), "VerifyEmail");
const Dashboard = named(() => import("./pages/Dashboard"), "Dashboard");
const Assistant = named(() => import("./pages/Assistant"), "Assistant");
const Profile = named(() => import("./pages/Profile"), "Profile");
const Projects = named(() => import("./pages/Projects"), "Projects");
const Certifications = named(() => import("./pages/Certifications"), "Certifications");
const InterviewPractice = named(() => import("./pages/InterviewPractice"), "InterviewPractice");
const Feedback = named(() => import("./pages/Feedback"), "Feedback");
const Settings = named(() => import("./pages/Settings"), "Settings");
const Resume = named(() => import("./pages/Resume"), "Resume");
const PublicPortfolio = named(() => import("./pages/PublicPortfolio"), "PublicPortfolio");
const Directory = named(() => import("./pages/Directory"), "Directory");
const NotFound = named(() => import("./pages/NotFound"), "NotFound");
const Privacy = lazy(() => import("./pages/Legal").then((m) => ({ default: () => <m.Legal page="privacy" /> })));
const Terms = lazy(() => import("./pages/Legal").then((m) => ({ default: () => <m.Legal page="terms" /> })));
const AdminOverview = named(() => import("./pages/admin/AdminOverview"), "AdminOverview");
const AdminUsers = named(() => import("./pages/admin/AdminUsers"), "AdminUsers");
const AdminFeedback = named(() => import("./pages/admin/AdminFeedback"), "AdminFeedback");
const AdminQuestions = named(() => import("./pages/admin/AdminQuestions"), "AdminQuestions");
const AdminComments = named(() => import("./pages/admin/AdminComments"), "AdminComments");
const AdminAudit = named(() => import("./pages/admin/AdminAudit"), "AdminAudit");

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ErrorBoundary>
          <UiProvider>
            <AuthProvider>
              <ChatProvider>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/p/:slug" element={<PublicPortfolio />} />

                    <Route element={<OptionalAuthRoute />}>
                      <Route path="/directory" element={<Directory />} />
                    </Route>

                    <Route element={<BareProtectedRoute />}>
                      <Route path="/resume" element={<Resume />} />
                    </Route>

                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/assistant" element={<Assistant />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/certifications" element={<Certifications />} />
                      <Route path="/interview" element={<InterviewPractice />} />
                      <Route path="/feedback" element={<Feedback />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>

                    <Route path="/admin" element={<AdminRoute />}>
                      <Route index element={<AdminOverview />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="feedback" element={<AdminFeedback />} />
                      <Route path="questions" element={<AdminQuestions />} />
                      <Route path="comments" element={<AdminComments />} />
                      <Route path="audit" element={<AdminAudit />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ChatProvider>
            </AuthProvider>
          </UiProvider>
        </ErrorBoundary>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
