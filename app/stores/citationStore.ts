import { create } from "zustand";
import { GetMendeleyCitationsByQueryLoaderData } from "#app/routes/resources+/mendeley+/_index";
import type { Cite } from "#app/components/ui/citation/MendeleyCiteForm";

type CitationStore = {
  activeTab: "mendeley" | "manual";
  setActiveTab: (tab: "mendeley" | "manual") => void;
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
          (cite) => cite.mendeley_id !== identifier && cite.title !== identifier
        ),
      },
    })),
  resetStore: () => set(initialState),
}));
