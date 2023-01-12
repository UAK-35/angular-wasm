import { AfterViewInit, Directive } from "@angular/core";
import { loadScript } from "./tools";
import { environment } from "../../environments/environment";
import wasmCacheBusting from "../../wasm-cache-busting.json";

type EmscriptenModuleDecorator<M extends EmscriptenModule> = (module: M) => void;

const noopModuleDecorator = (mod: EmscriptenModule) => mod;

@Directive()
export abstract class EmscriptenWasmComponent<M extends EmscriptenModule = EmscriptenModule> implements AfterViewInit {
  private resolvedModule: M;
  protected moduleDecorator: EmscriptenModuleDecorator<M>;

  protected constructor(private moduleExportName: string, private wasmJavaScriptLoader: string) {}

  get module(): M {
    return this.resolvedModule;
  }

  ngAfterViewInit(): void {
    this.resolveModule();
  }

  protected resolveModule(): void {
    const jsVersion = wasmCacheBusting[this.wasmJavaScriptLoader]
      ? `?v=${wasmCacheBusting[this.wasmJavaScriptLoader]}`
      : "";
    loadScript(this.moduleExportName, `${environment.wasmAssetsPath}/${this.wasmJavaScriptLoader}${jsVersion}`)
      .then(() => {
        const moduleObj = <M>{
          locateFile: (file: string) => {
            const fileVersion = wasmCacheBusting[file] ? `?v=${wasmCacheBusting[file]}` : "";
            console.log('file', file, 'fileVersion', fileVersion);
            return `${environment.wasmAssetsPath}/${file}${fileVersion}`;
          },
        };
        const moduleDecorator: EmscriptenModuleDecorator<M> = this.moduleDecorator || noopModuleDecorator;
        moduleDecorator(moduleObj);

        return window[this.moduleExportName](moduleObj);
      })
      .then((mod) => {
        this.resolvedModule = mod as M;
      });
  }
}
