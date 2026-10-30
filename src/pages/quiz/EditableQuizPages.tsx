import { useMemo } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Button } from "@moshebari/cads-react";
import { AssessmentBuilderWorkspace } from "../../components/assessment/builder";
import { QuizAttemptWorkspace } from "../../components/assessment/quiz/QuizAttemptWorkspace";
import {
  editableQuizDemoBySlug,
  editableQuizEditPath,
  editableQuizPlayPath,
  type EditableQuizDemoId,
} from "../../data/assessmentBuilder/editableQuizDemos";
import { useEditableQuiz } from "../../hooks/useEditableQuiz";
import { resolvedAllowRetries } from "../../lib/assessmentBuilder";
import { loadStoredQuizAttempts } from "../../lib/assessmentBuilder/submittedAttempts";
import {
  buildEditableQuizSubmission,
  buildEditableQuizSubmissionHistory,
  EDITABLE_QUIZ_VIEW_PARAM,
  parseEditableQuizView,
  submissionVersionsFromAttempts,
  type EditableQuizView,
} from "../../lib/assessmentBuilder/editableQuizViewpoint";
import {
  editableQuizEditLinks,
  editableQuizPlayLinks,
} from "../levelTypeLinks";

const VIEW_OPTIONS: Array<{
  value: EditableQuizView;
  label: string;
  iconName: string;
}> = [
  { value: "student", label: "Student", iconName: "user" },
  { value: "teacher", label: "Teacher", iconName: "chalkboard-user" },
  {
    value: "submission",
    label: "Student submission",
    iconName: "clipboard-list-check",
  },
  {
    value: "in-progress",
    label: "Submission in progress",
    iconName: "hourglass-half",
  },
];

function EditableQuizStudentView({ demoId }: { demoId: EditableQuizDemoId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseEditableQuizView(searchParams.get(EDITABLE_QUIZ_VIEW_PARAM));
  const { artifact, bankQuestions, resolvedQuestions } = useEditableQuiz(demoId);
  const editPath = editableQuizEditPath(demoId);
  const recordedAttempts = useMemo(
    () =>
      artifact ? loadStoredQuizAttempts(artifact.id, artifact.updatedAt) : [],
    [artifact, view],
  );
  const submissionHistory = useMemo(() => {
    if (recordedAttempts.length > 0) {
      return submissionVersionsFromAttempts(recordedAttempts);
    }
    return buildEditableQuizSubmissionHistory(resolvedQuestions, {
      retriesAllowed: artifact ? resolvedAllowRetries(artifact) : false,
      maxAttempts: artifact?.attempts?.maxAttempts,
    });
  }, [artifact, recordedAttempts, resolvedQuestions]);
  const submission = submissionHistory[0]?.response;
  const inProgress = useMemo(
    () => buildEditableQuizSubmission(resolvedQuestions, { submitted: false }),
    [resolvedQuestions],
  );
  const responseReview =
    view === "submission" || view === "in-progress" ? view : null;

  if (!artifact) return null;

  const openBuilder = () => {
    navigate({ pathname: editPath, search: location.search });
  };

  const selectView = (next: string) => {
    const viewNext = parseEditableQuizView(next);
    const params = new URLSearchParams(searchParams);
    if (viewNext === "student") params.delete(EDITABLE_QUIZ_VIEW_PARAM);
    else params.set(EDITABLE_QUIZ_VIEW_PARAM, viewNext);
    setSearchParams(params, { replace: true });
  };

  return (
    <QuizAttemptWorkspace
      key={`${demoId}-${view}`}
      artifact={artifact}
      bankQuestions={bankQuestions}
      levelLinks={editableQuizPlayLinks}
      currentLevelPath={editableQuizPlayPath(demoId)}
      viewpoint={
        view === "teacher"
          ? "teacher"
          : responseReview
            ? "studentResponse"
            : undefined
      }
      studentResponse={
        responseReview === "submission"
          ? submission
          : responseReview === "in-progress"
            ? inProgress
            : undefined
      }
      submissionVersions={
        responseReview === "submission" ? submissionHistory : undefined
      }
      submissionHistoryLive={
        responseReview === "submission" && recordedAttempts.length > 0
      }
      accountMenu={{
        value: view,
        options: VIEW_OPTIONS,
        onSelect: selectView,
      }}
      headerActions={
        <Button
          variant="outlined"
          color="secondary"
          size="extraSmall"
          startIconName="pen-to-square"
          onClick={openBuilder}
        >
          Edit
        </Button>
      }
      emptyState={{
        title: "This quiz is empty",
        body: "Add questions in the quiz builder, then save to see them here.",
        actionLabel: "Edit quiz",
        onAction: openBuilder,
      }}
    />
  );
}

function EditableQuizBuilderView({ demoId }: { demoId: EditableQuizDemoId }) {
  return (
    <AssessmentBuilderWorkspace
      key={demoId}
      assessmentId={demoId}
      levelLinks={editableQuizEditLinks}
      currentLevelPath={editableQuizEditPath(demoId)}
      playPath={editableQuizPlayPath(demoId)}
      p0Aligned
    />
  );
}

export function EditableQuizStudentPage() {
  const { demoSlug } = useParams();
  const demo = editableQuizDemoBySlug(demoSlug);
  if (!demo) return <Navigate to="/levels" replace />;
  return <EditableQuizStudentView demoId={demo.id} />;
}

export function EditableQuizBuilderPage() {
  const { demoSlug } = useParams();
  const demo = editableQuizDemoBySlug(demoSlug);
  if (!demo) return <Navigate to="/levels" replace />;
  return <EditableQuizBuilderView demoId={demo.id} />;
}
