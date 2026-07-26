import { create } from "zustand";
import { GetMendeleyCitationsByQueryLoaderData } from "#app/routes/resources+/mendeley+/_index";
import type { OpenAlexSuggestion } from "#app/services/openalex.server";
import type { Cite } from "#app/components/ui/citation/MendeleyCiteForm";

type CitationStore = {
  activeTab: "mendeley" | "suggestions" | "manual";
  setActiveTab: (tab: "mendeley" | "suggestions" | "manual") => void;
  mendeleyCiteFormState: {
    searchQuery: string;
    selectedCites: Cite[];
    searchResults: GetMendeleyCitationsByQueryLoaderData["citations"] | null;
  };
  setMendeleyCiteFormState: (
    state: Partial<CitationStore["mendeleyCiteFormState"]>
  ) => void;
  setSearchResults: (
    results: GetMendeleyCitationsByQueryLoaderData["citations"] | null
  ) => void;
  openAlexSuggestionState: {
    suggestions: OpenAlexSuggestion[] | null;
    loading: boolean;
  };
  setOpenAlexSuggestions: (suggestions: OpenAlexSuggestion[] | null) => void;
  setOpenAlexSuggestionsLoading: (loading: boolean) => void;
  addSelectedCite: (cite: Cite) => void;
  removeSelectedCite: (identifier: string) => void;
  resetStore: () => void;
};

const initialState = {
  activeTab: "mendeley" as const,
  mendeleyCiteFormState: {
    searchQuery: "",
    selectedCites: [],
    searchResults: null,
  },
  openAlexSuggestionState: {
    suggestions: null,
    loading: false,
  },
};

export const useCitationStore = create<CitationStore>((set) => ({
  ...initialState,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMendeleyCiteFormState: (state) =>
    set((prevState) => ({
      mendeleyCiteFormState: { ...prevState.mendeleyCiteFormState, ...state },
    })),
  setSearchResults: (results) =>
    set((state) => ({
      mendeleyCiteFormState: {
        ...state.mendeleyCiteFormState,
        searchResults: results,
      },
    })),
  setOpenAlexSuggestions: (suggestions) =>
    set((state) => ({
      openAlexSuggestionState: { ...state.openAlexSuggestionState, suggestions },
    })),
  setOpenAlexSuggestionsLoading: (loading) =>
    set((state) => ({
      openAlexSuggestionState: { ...state.openAlexSuggestionState, loading },
    })),
  addSelectedCite: (cite) =>
    set((state) => ({
      mendeleyCiteFormState: {
        ...state.mendeleyCiteFormState,
        selectedCites: [...state.mendeleyCiteFormState.selectedCites, cite],
      },
    })),
  removeSelectedCite: (identifier) =>
    set((state) => ({
      mendeleyCiteFormState: {
        ...state.mendeleyCiteFormState,
        selectedCites: state.mendeleyCiteFormState.selectedCites.filter(
          (cite) =>
            cite.mendeley_id !== identifier &&
            cite.openalex_id !== identifier &&
            cite.title !== identifier
        ),
      },
    })),
  resetStore: () => set(initialState),
}));
