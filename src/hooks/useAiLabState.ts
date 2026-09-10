import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_KNN_K, holdoutIndexes, trainModel } from "../lib/aiLab";
import type {
  AiLabAlgorithmId,
  AiLabCardLayout,
  AiLabDataRow,
  AiLabDataView,
  AiLabLevelConfig,
  AiLabSection,
  AiLabTrainedModel,
} from "../types/aiLab";

export interface AiLabState {
  section: AiLabSection;
  selectedAlgorithm: AiLabAlgorithmId | undefined;
  dataView: AiLabDataView;
  cardLayout: AiLabCardLayout;
  selectedColumnId: string | undefined;
  cardIndex: number;
  labelColumn: string | undefined;
  selectedFeatures: string[];
  model: AiLabTrainedModel | undefined;
  testValues: AiLabDataRow;
  lastPrediction: string | undefined;
  knnK: number;
  trainingSetupOpen: boolean;
}

function setupSection(config: AiLabLevelConfig): AiLabSection {
  return config.trainAsOverlay ? "dataset" : "train";
}

function firstVisibleSection(
  config: AiLabLevelConfig,
  algorithm: AiLabAlgorithmId | undefined,
): AiLabSection {
  if (!algorithm && !config.algorithmLock) return "algorithm";
  if (config.initialSection === "test") return "test";
  if (config.initialSection === "train" && !config.hideTrainTab) {
    return setupSection(config);
  }
  if (!config.hideDatasetTab) return "dataset";
  if (!config.hideTrainTab) return "train";
  return "test";
}

function emptyTestValues(
  config: AiLabLevelConfig,
  features: string[],
): AiLabDataRow {
  const values: AiLabDataRow = {};
  features.forEach((feature) => {
    const column = config.dataset.columns.find((entry) => entry.id === feature);
    values[feature] = column?.type === "numerical" ? "" : "";
  });
  return values;
}

function initialState(config: AiLabLevelConfig): AiLabState {
  const selectedAlgorithm = config.algorithmLock ?? config.pretrained?.algorithm;
  const labelColumn =
    config.pretrained?.labelColumn ??
    (config.hideLabelSelect ? config.dataset.defaultLabelColumn : undefined);
  const selectedFeatures = config.pretrained?.selectedFeatures ?? [];
  const model =
    config.pretrained && selectedAlgorithm
      ? trainModel({
          algorithm: selectedAlgorithm,
          rows: config.dataset.rows,
          columns: config.dataset.columns,
          labelColumn: config.pretrained.labelColumn,
          selectedFeatures: config.pretrained.selectedFeatures,
          knnK: config.defaultKnnK,
          holdoutCount: config.holdoutCount,
        })
      : undefined;

  return {
    section: firstVisibleSection(config, selectedAlgorithm),
    selectedAlgorithm,
    dataView: "table",
    cardLayout: "catalog",
    selectedColumnId: undefined,
    cardIndex: 0,
    labelColumn,
    selectedFeatures,
    model,
    testValues: emptyTestValues(config, selectedFeatures),
    lastPrediction: undefined,
    knnK: config.defaultKnnK ?? DEFAULT_KNN_K,
    trainingSetupOpen: Boolean(config.trainAsOverlay && config.pretrained),
  };
}

function configIdentity(config: AiLabLevelConfig): string {
  const pretrained = config.pretrained
    ? [
        config.pretrained.algorithm,
        config.pretrained.labelColumn,
        config.pretrained.selectedFeatures.join(","),
      ].join(":")
    : "";
  return [
    config.dataset.id,
    config.algorithmLock ?? "",
    config.hideDatasetTab ? "1" : "0",
    config.hideTrainTab ? "1" : "0",
    config.hideLabelSelect ? "1" : "0",
    config.initialSection ?? "",
    config.classificationOnly ? "1" : "0",
    config.trainAsOverlay ? "1" : "0",
    String(config.defaultKnnK ?? ""),
    String(config.holdoutCount ?? ""),
    pretrained,
  ].join("|");
}

export function useAiLabState(config: AiLabLevelConfig) {
  const [state, setState] = useState<AiLabState>(() => initialState(config));
  const identity = configIdentity(config);
  const identityRef = useRef(identity);

  useEffect(() => {
    if (identityRef.current === identity) return;
    identityRef.current = identity;
    setState(initialState(config));
  }, [config, identity]);

  const visibleSections = useMemo(() => {
    const sections: AiLabSection[] = [];
    if (!config.hideDatasetTab) sections.push("dataset");
    if (!config.hideTrainTab && !config.trainAsOverlay) sections.push("train");
    sections.push("test");
    return sections;
  }, [config.hideDatasetTab, config.hideTrainTab]);

  const canVisit = useCallback(
    (section: AiLabSection) => {
      if (section === "algorithm") return !config.algorithmLock;
      if (!state.selectedAlgorithm) return false;
      if (section === "test") return Boolean(state.model);
      return visibleSections.includes(section);
    },
    [config.algorithmLock, state.model, state.selectedAlgorithm, visibleSections],
  );

  const setSection = useCallback(
    (section: AiLabSection) => {
      if (!canVisit(section) && section !== state.section) return;
      setState((current) => ({ ...current, section }));
    },
    [canVisit, state.section],
  );

  const selectAlgorithm = useCallback((
    algorithm: AiLabAlgorithmId,
    options?: { advance?: boolean },
  ) => {
    setState((current) => ({
      ...current,
      selectedAlgorithm: algorithm,
      section:
        options?.advance === false
          ? current.section === "test"
            ? setupSection(config)
            : current.section
          : firstVisibleSection(
              { ...config, initialSection: undefined },
              algorithm,
            ),
      model: undefined,
      lastPrediction: undefined,
      trainingSetupOpen:
        options?.advance === false && current.section === "test"
          ? true
          : current.trainingSetupOpen,
    }));
  }, [config]);

  const startOver = useCallback(() => {
    setState((current) => ({
      ...initialState({
        ...config,
        pretrained: config.algorithmLock ? config.pretrained : undefined,
        initialSection: config.algorithmLock ? config.initialSection : "algorithm",
      }),
      dataView: current.dataView,
      cardLayout: current.cardLayout,
    }));
  }, [config]);

  const setCardIndex = useCallback((cardIndex: number) => {
    setState((current) => ({ ...current, cardIndex }));
  }, []);

  const setDataView = useCallback((dataView: AiLabDataView) => {
    setState((current) => ({
      ...current,
      dataView,
    }));
  }, []);

  const setCardLayout = useCallback((cardLayout: AiLabCardLayout) => {
    setState((current) => ({ ...current, cardLayout }));
  }, []);

  const selectColumn = useCallback((columnId: string) => {
    setState((current) => ({
      ...current,
      selectedColumnId:
        current.selectedColumnId === columnId ? undefined : columnId,
    }));
  }, []);

  const setLabelColumn = useCallback((columnId: string) => {
    setState((current) => ({
      ...current,
      labelColumn: columnId,
      selectedFeatures: current.selectedFeatures.filter(
        (feature) => feature !== columnId,
      ),
      model: undefined,
      lastPrediction: undefined,
      section: current.section === "test" ? setupSection(config) : current.section,
      trainingSetupOpen:
        current.section === "test" ? true : current.trainingSetupOpen,
    }));
  }, [config]);

  const toggleFeature = useCallback((columnId: string) => {
    setState((current) => {
      const selected = current.selectedFeatures.includes(columnId)
        ? current.selectedFeatures.filter((feature) => feature !== columnId)
        : [...current.selectedFeatures, columnId];
      return {
        ...current,
        selectedFeatures: selected,
        model: undefined,
        lastPrediction: undefined,
        testValues: emptyTestValues(config, selected),
        section: current.section === "test" ? setupSection(config) : current.section,
        trainingSetupOpen:
          current.section === "test" ? true : current.trainingSetupOpen,
      };
    });
  }, [config]);

  const setKnnK = useCallback((knnK: number) => {
    setState((current) => ({
      ...current,
      knnK,
      model: undefined,
      lastPrediction: undefined,
      section: current.section === "test" ? setupSection(config) : current.section,
      trainingSetupOpen:
        current.section === "test" ? true : current.trainingSetupOpen,
    }));
  }, [config]);

  const setTrainingSetupOpen = useCallback((trainingSetupOpen: boolean) => {
    setState((current) => ({
      ...current,
      trainingSetupOpen,
      section: trainingSetupOpen && current.section === "test"
        ? setupSection(config)
        : current.section,
    }));
  }, [config]);

  const train = useCallback(() => {
    setState((current) => {
      if (
        !current.selectedAlgorithm ||
        !current.labelColumn ||
        current.selectedFeatures.length === 0
      ) {
        return current;
      }
      const model = trainModel({
        algorithm: current.selectedAlgorithm,
        rows: config.dataset.rows,
        columns: config.dataset.columns,
        labelColumn: current.labelColumn,
        selectedFeatures: current.selectedFeatures,
        knnK: current.knnK,
        holdoutCount: config.holdoutCount,
      });
      return {
        ...current,
        model,
        testValues: emptyTestValues(config, current.selectedFeatures),
        lastPrediction: undefined,
        trainingSetupOpen: config.trainAsOverlay ? true : current.trainingSetupOpen,
      };
    });
  }, [config]);

  const setTestValue = useCallback((feature: string, value: string) => {
    setState((current) => ({
      ...current,
      testValues: { ...current.testValues, [feature]: value },
      lastPrediction: undefined,
    }));
  }, []);

  const setLastPrediction = useCallback((prediction: string | undefined) => {
    setState((current) =>
      current.lastPrediction === prediction
        ? current
        : { ...current, lastPrediction: prediction },
    );
  }, []);

  const loadHoldoutRow = useCallback((rowIndex: number) => {
    setState((current) => {
      if (!current.model) return current;
      const row = config.dataset.rows[rowIndex];
      const testValues: AiLabDataRow = {};
      current.model.selectedFeatures.forEach((feature) => {
        testValues[feature] = row[feature];
      });
      return {
        ...current,
        testValues,
        lastPrediction: undefined,
      };
    });
  }, [config.dataset.rows]);

  const reservedRowIndexes = useMemo(
    () => holdoutIndexes(config.dataset.rows.length, config.holdoutCount),
    [config.dataset.rows.length, config.holdoutCount],
  );

  const labelIsValid = Boolean(
    state.labelColumn &&
      (!config.classificationOnly ||
        config.dataset.columns.find((column) => column.id === state.labelColumn)
          ?.type === "categorical"),
  );

  const canTrain = Boolean(
    state.selectedAlgorithm &&
      labelIsValid &&
      state.selectedFeatures.length > 0 &&
      !state.selectedFeatures.includes(state.labelColumn ?? ""),
  );

  const trainBlockedReason = !state.selectedAlgorithm
    ? "Choose an algorithm first."
    : !state.labelColumn
      ? "Choose what the model should predict."
      : !labelIsValid
        ? "This lab predicts categories. Pick a categorical column as the label."
        : state.selectedFeatures.length === 0
          ? "Add at least one feature column."
          : undefined;

  return {
    ...state,
    config,
    visibleSections,
    reservedRowIndexes,
    canVisit,
    canTrain,
    trainBlockedReason,
    setSection,
    selectAlgorithm,
    startOver,
    setCardIndex,
    setDataView,
    setCardLayout,
    setTrainingSetupOpen,
    selectColumn,
    setLabelColumn,
    toggleFeature,
    setKnnK,
    train,
    setTestValue,
    loadHoldoutRow,
    setLastPrediction,
  };
}

export type AiLabController = ReturnType<typeof useAiLabState>;
