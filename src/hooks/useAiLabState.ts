import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  catalogDatasets,
  DEFAULT_KNN_K,
  featureNotice,
  initialDatasetId,
  labelNotice,
  resolveDataset,
  trainModel,
} from "../lib/aiLab";
import type {
  AiLabAlgorithmId,
  AiLabCardLayout,
  AiLabCellValue,
  AiLabDataRow,
  AiLabDataView,
  AiLabLevelConfig,
  AiLabSavedModel,
  AiLabSection,
  AiLabTrainedModel,
} from "../types/aiLab";

export interface AiLabState {
  section: AiLabSection;
  datasetId: string | undefined;
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
  rows: AiLabDataRow[];
  savedModels: AiLabSavedModel[];
}

function cloneRows(rows: AiLabDataRow[]): AiLabDataRow[] {
  return rows.map((row) => ({ ...row }));
}

function setupSection(config: AiLabLevelConfig): AiLabSection {
  return config.trainAsOverlay ? "dataset" : "train";
}

function firstVisibleSection(
  config: AiLabLevelConfig,
  algorithm: AiLabAlgorithmId | undefined,
): AiLabSection {
  if (!algorithm && !config.algorithmLock && !config.trainAsOverlay) {
    return "algorithm";
  }
  if (config.initialSection === "test") return "test";
  if (config.initialSection === "train" && !config.hideTrainTab) {
    return setupSection(config);
  }
  if (!config.hideDatasetTab) return "dataset";
  if (!config.hideTrainTab) return "train";
  return "test";
}

function emptyTestValues(features: string[]): AiLabDataRow {
  const values: AiLabDataRow = {};
  features.forEach((feature) => {
    values[feature] = "";
  });
  return values;
}

function initialState(config: AiLabLevelConfig): AiLabState {
  const datasetId = initialDatasetId(config);
  const dataset = resolveDataset(config, datasetId);
  const selectedAlgorithm = config.algorithmLock ?? config.pretrained?.algorithm;
  const labelColumn =
    config.pretrained?.labelColumn ??
    (config.hideLabelSelect ? dataset?.defaultLabelColumn : undefined);
  const selectedFeatures = config.pretrained?.selectedFeatures ?? [];
  const model =
    config.pretrained && selectedAlgorithm && dataset
      ? trainModel({
          algorithm: selectedAlgorithm,
          rows: dataset.rows,
          columns: dataset.columns,
          labelColumn: config.pretrained.labelColumn,
          selectedFeatures: config.pretrained.selectedFeatures,
          knnK: config.defaultKnnK,
        })
      : undefined;

  return {
    section: firstVisibleSection(config, selectedAlgorithm),
    datasetId,
    selectedAlgorithm,
    dataView: "table",
    cardLayout: "catalog",
    selectedColumnId: undefined,
    cardIndex: 0,
    labelColumn,
    selectedFeatures,
    model,
    testValues: emptyTestValues(selectedFeatures),
    lastPrediction: undefined,
    knnK: config.defaultKnnK ?? DEFAULT_KNN_K,
    trainingSetupOpen: Boolean(config.trainAsOverlay && config.pretrained),
    rows: dataset ? cloneRows(dataset.rows) : [],
    savedModels: [],
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
    catalogDatasets(config)
      .map((dataset) => dataset.id)
      .join(","),
    config.lockDataset ? "1" : "0",
    config.requireDatasetChoice ? "1" : "0",
    config.showModelDetails ? "1" : "0",
    config.showExport ? "1" : "0",
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
    setState((current) => ({
      ...initialState(config),
      savedModels: current.savedModels,
    }));
  }, [config, identity]);

  const availableDatasets = useMemo(
    () => catalogDatasets(config),
    [config],
  );
  const activeDataset = resolveDataset(config, state.datasetId);
  const resolvedConfig = useMemo(
    () => ({
      ...config,
      dataset: activeDataset ?? config.dataset,
    }),
    [activeDataset, config],
  );

  const visibleSections = useMemo(() => {
    const sections: AiLabSection[] = [];
    if (!config.hideDatasetTab) sections.push("dataset");
    if (!config.hideTrainTab && !config.trainAsOverlay) sections.push("train");
    sections.push("test");
    return sections;
  }, [config.hideDatasetTab, config.hideTrainTab, config.trainAsOverlay]);

  const canVisit = useCallback(
    (section: AiLabSection) => {
      if (section === "algorithm") return !config.algorithmLock;
      if (section === "test") return Boolean(state.model);
      if (!state.datasetId) {
        return section === "dataset";
      }
      if (!state.selectedAlgorithm) {
        return section === "dataset" || section === "train";
      }
      return visibleSections.includes(section);
    },
    [
      config.algorithmLock,
      state.datasetId,
      state.model,
      state.selectedAlgorithm,
      visibleSections,
    ],
  );

  const setSection = useCallback(
    (section: AiLabSection) => {
      if (!canVisit(section) && section !== state.section) return;
      setState((current) => ({ ...current, section }));
    },
    [canVisit, state.section],
  );

  const selectDataset = useCallback(
    (datasetId: string) => {
      setState((current) => {
        if (current.datasetId === datasetId) return current;
        const dataset = resolveDataset(config, datasetId);
        if (!dataset) return current;
        const labelColumn = config.hideLabelSelect
          ? dataset.defaultLabelColumn
          : undefined;
        return {
          ...current,
          datasetId,
          rows: cloneRows(dataset.rows),
          selectedColumnId: undefined,
          cardIndex: 0,
          labelColumn,
          selectedFeatures: [],
          model: undefined,
          lastPrediction: undefined,
          testValues: emptyTestValues([]),
          section:
            current.section === "test" ? setupSection(config) : current.section,
          trainingSetupOpen: false,
        };
      });
    },
    [config],
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
        initialSection: config.algorithmLock
          ? config.initialSection
          : config.trainAsOverlay
            ? "dataset"
            : "algorithm",
      }),
      dataView: current.dataView,
      cardLayout: current.cardLayout,
      savedModels: current.savedModels,
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

  const setSelectedColumnId = useCallback((columnId: string | undefined) => {
    setState((current) =>
      current.selectedColumnId === columnId
        ? current
        : { ...current, selectedColumnId: columnId },
    );
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

  const setFeatures = useCallback((featureIds: string[]) => {
    setState((current) => {
      const selected = featureIds.filter(
        (feature) => feature !== current.labelColumn,
      );
      const unchanged =
        selected.length === current.selectedFeatures.length &&
        selected.every((feature) => current.selectedFeatures.includes(feature));
      if (unchanged) return current;
      return {
        ...current,
        selectedFeatures: selected,
        model: undefined,
        lastPrediction: undefined,
        testValues: emptyTestValues(selected),
        section: current.section === "test" ? setupSection(config) : current.section,
        trainingSetupOpen:
          current.section === "test" ? true : current.trainingSetupOpen,
      };
    });
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
        testValues: emptyTestValues(selected),
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

  const updateCell = useCallback(
    (rowIndex: number, columnId: string, value: AiLabCellValue) => {
      setState((current) => {
        const row = current.rows[rowIndex];
        if (!row || row[columnId] === value) return current;
        return {
          ...current,
          rows: current.rows.map((entry, index) =>
            index === rowIndex ? { ...entry, [columnId]: value } : entry,
          ),
          model: undefined,
          lastPrediction: undefined,
        };
      });
    },
    [],
  );

  const addRow = useCallback(() => {
    setState((current) => {
      const dataset = resolveDataset(config, current.datasetId);
      if (!dataset) return current;
      const next: AiLabDataRow = {};
      dataset.columns.forEach((column) => {
        const sample = current.rows[0]?.[column.id];
        next[column.id] =
          column.type === "numerical"
            ? 0
            : typeof sample === "string"
              ? sample
              : "";
      });
      return {
        ...current,
        rows: [...current.rows, next],
        model: undefined,
        lastPrediction: undefined,
      };
    });
  }, [config]);

  const train = useCallback(() => {
    setState((current) => {
      const dataset = resolveDataset(config, current.datasetId);
      if (
        !dataset ||
        !current.selectedAlgorithm ||
        !current.labelColumn ||
        current.selectedFeatures.length === 0
      ) {
        return current;
      }
      const model = trainModel({
        algorithm: current.selectedAlgorithm,
        rows: current.rows,
        columns: dataset.columns,
        labelColumn: current.labelColumn,
        selectedFeatures: current.selectedFeatures,
        knnK: config.defaultKnnK != null ? current.knnK : undefined,
        holdoutCount:
          config.holdoutCount ??
          (config.defaultKnnK != null ? 0 : undefined),
      });
      return {
        ...current,
        knnK: model.knnK ?? current.knnK,
        model,
        testValues: emptyTestValues(current.selectedFeatures),
        lastPrediction: undefined,
        trainingSetupOpen: config.trainAsOverlay ? true : current.trainingSetupOpen,
      };
    });
  }, [config]);

  const saveModel = useCallback(
    (draft: { name: string; intendedUse: string; limitations: string }) => {
      setState((current) => {
        const dataset = resolveDataset(config, current.datasetId);
        if (!current.model || !dataset) return current;
        const saved: AiLabSavedModel = {
          id: `saved-${Date.now()}`,
          name: draft.name.trim() || `${dataset.name} model`,
          intendedUse: draft.intendedUse.trim(),
          limitations: draft.limitations.trim(),
          datasetId: dataset.id,
          datasetName: dataset.name,
          savedAt: Date.now(),
          model: current.model,
        };
        return {
          ...current,
          savedModels: [saved, ...current.savedModels],
        };
      });
    },
    [config],
  );

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
      const row = current.rows[rowIndex];
      if (!row) return current;
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
  }, []);

  const columns = resolvedConfig.dataset.columns;
  const labelIsValid = Boolean(
    state.labelColumn &&
      (!config.classificationOnly ||
        columns.find((column) => column.id === state.labelColumn)?.type ===
          "categorical"),
  );

  // Too many distinct categories: the model cannot generalize and the viz
  // cannot draw them. Blocked columns stop training; crowded labels only warn.
  const labelCardinality = labelNotice(state.rows, columns, state.labelColumn);
  const featureCardinality = featureNotice(
    state.rows,
    columns,
    state.selectedFeatures,
  );
  const labelBlocked = labelCardinality?.sentiment === "error";
  const featuresBlocked = featureCardinality?.sentiment === "error";

  const canTrain = Boolean(
    state.datasetId &&
      state.selectedAlgorithm &&
      labelIsValid &&
      !labelBlocked &&
      !featuresBlocked &&
      state.selectedFeatures.length > 0 &&
      !state.selectedFeatures.includes(state.labelColumn ?? ""),
  );

  const trainBlockedReason = !state.datasetId
    ? "Choose a dataset first."
    : !state.selectedAlgorithm
      ? "Choose an algorithm first."
      : !state.labelColumn
        ? "Choose what the model should predict."
        : !labelIsValid
          ? "This lab predicts categories. Pick a categorical column as the label."
          : labelCardinality?.sentiment === "error"
            ? labelCardinality.text
            : state.selectedFeatures.length === 0
              ? "Add at least one feature column."
              : featureCardinality?.sentiment === "error"
                ? featureCardinality.text
                : undefined;

  return {
    ...state,
    config: resolvedConfig,
    availableDatasets,
    canPickDataset: !config.lockDataset,
    needsDataset: !state.datasetId,
    visibleSections,
    canVisit,
    canTrain,
    trainBlockedReason,
    labelCardinality,
    featureCardinality,
    setSection,
    selectDataset,
    selectAlgorithm,
    startOver,
    setCardIndex,
    setDataView,
    setCardLayout,
    setTrainingSetupOpen,
    selectColumn,
    setSelectedColumnId,
    setLabelColumn,
    toggleFeature,
    setFeatures,
    setKnnK,
    updateCell,
    addRow,
    train,
    saveModel,
    setTestValue,
    loadHoldoutRow,
    setLastPrediction,
  };
}

export type AiLabController = ReturnType<typeof useAiLabState>;
