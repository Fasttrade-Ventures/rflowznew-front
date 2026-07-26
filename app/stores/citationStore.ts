import { create } from "zustand";
import type { OpenAlexSuggestion, OpenAlexWork } from "#app/services/openalex.server";
import type { Cite } from "#app/components/ui/citation/MendeleyCiteForm";

type CitationStore = {
  activeTab: "search" | "manual";
  setActiveTab: (tab: "search" | "manual") => void;
  citeFormState: {
    selectedCites: Cite[];
  };
  openAlexSuggestionState: {
    suggestions: OpenAlexSuggestion[] | null;
    loading: boolean;
  };
  setOpenAlexSuggestions: (suggestions: OpenAlexSuggestion[] | null) => void;
  setOpenAlexSuggestionsLoading: (loading: boolean) => void;
  openAlexSearchState: {
    query: string;
    results: OpenAlexWork[] | null;
    loading: boolean;
  };
  setOpenAlexSearchQuery: (query: string) => void;
  setOpenAlexSearchResults: (results: OpenAlexWork[] | null) => void;
  setOpenAlexSearchLoading: (loading: boolean) => void;
  addSelectedCite: (cite: Cite) => void;
  removeSelectedCite: (identifier: string) => void;
  resetStore: () => void;
};

const initialState = {
  activeTab: "search" as const,
  citeFormState: {
    selectedCites: [],
  },
  openAlexSuggestionState: {
    suggestions: null,
    loading: false,
  },
  openAlexSearchState: {
    query: "",
    results: null,
    loading: false,
  },
};

export const useCitationStore = create<CitationStore>((set) => ({
  ...initialState,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setOpenAlexSuggestions: (suggestions) =>
    set((state) => ({
      openAlexSuggestionState: { ...state.openAlexSuggestionState, suggestions },
    })),
  setOpenAlexSuggestionsLoading: (loading) =>
    set((state) => ({
      openAlexSuggestionState: { ...state.openAlexSuggestionState, loading },
    })),
  setOpenAlexSearchQuery: (query) =>
    set((state) => ({
      openAlexSearchState: { ...state.openAlexSearchState, query },
    })),
  setOpenAlexSearchResults: (results) =>
    set((state) => ({
      openAlexSearchState: { ...state.openAlexSearchState, results },
    })),
  setOpenAlexSearchLoading: (loading) =>
    set((state) => ({
      openAlexSearchState: { ...state.openAlexSearchState, loading },
    })),
  addSelectedCite: (cite) =>
    set((state) => ({
      citeFormState: {
        ...state.citeFormState,
        selectedCites: [...state.citeFormState.selectedCites, cite],
      },
    })),
  removeSelectedCite: (identifier) =>
    set((state) => ({
      citeFormState: {
        ...state.citeFormState,
        selectedCites: state.citeFormState.selectedCites.filter(
          (cite) =>
            cite.mendeley_id !== identifier &&
            cite.openalex_id !== identifier &&
            cite.title !== identifier
        ),
      },
    })),
  resetStore: () => set(initialState),
}));
