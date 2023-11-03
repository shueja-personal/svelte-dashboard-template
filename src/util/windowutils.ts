import {appWindow} from "@tauri-apps/api/window"
import { get, type Readable } from "svelte/store";

export function preventCloseIf(condition: ()=>boolean | Readable<boolean>) {
    if (!condition["apply"]) {
        //@ts-expect-error
        condition = ()=>get(condition as Readable<boolean>);
    }
    appWindow.onCloseRequested(async (event)=> {
        if (condition()) {
            event.preventDefault();
        } else {
            appWindow.close();
        }
    })
}