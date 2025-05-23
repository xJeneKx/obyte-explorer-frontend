import { useGlobalStateStore } from "../stores/globalState";
import { EventNames } from "../enum/eventEnums";
import { getPathToServer } from "~/configs/pathToExplorer.js";

export default async function fetchAssetInfo(socket, asset, nextPageParams) {
  const { wsConnected } = storeToRefs(useGlobalStateStore());

  let type = "info";
  if (nextPageParams) {
    type = "next_page_transactions";
  }

  if (wsConnected.value) {
    return new Promise((resolve) => {
      if (type === "next_page_transactions") {
        nextPageParams.asset = asset;
        socket.emit(EventNames.LoadNextPageAssetTransactions, nextPageParams, resolve);
        return;
      }
      socket.emit(EventNames.GetAssetData, { asset }, resolve);
    });
  } else {
    const data = await $fetch(`${getPathToServer()}/api/asset/${encodeURIComponent(asset)}/${type}`, {
      params: { ...nextPageParams },
    });
    
    return data;
  }
}
