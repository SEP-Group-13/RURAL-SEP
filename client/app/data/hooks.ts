import { useEffect, useState } from "react";
import { participantApi } from "./api";
import type { View } from "./viewHandler";

function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });

  useEffect(() => {
    let current = true;
    setState((s) => ({ ...s, loading: true }));
    load().then(
      (data) => current && setState({ data, loading: false }),
      (error) => current && setState({ error, loading: false }),
    );
    return () => { current = false; };
  }, deps);

  return state;
}

export const useViewAll = (view: View) =>
  useAsync(() => view.getAll(), [view]);

export const useViewPage = (view: View, page: number) =>
  useAsync(() => view.getPage(page), [view, page]);

export const useParticipant = (id: string) =>
  useAsync(() => participantApi.getParticipant(id), [id]);
