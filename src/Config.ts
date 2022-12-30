import fs from 'fs';
import { ImGui } from 'ml64tk';
import { ml_template } from './template';

export interface ModLoader64 {
    rom: string;
    patch: string;
    isServer: boolean;
    isClient: boolean;
    supportedConsoles: string[];
    selectedConsole: string;
    coreOverride: string;
    disableVIUpdates: boolean;
    enableDebugger: boolean;
}

export interface NetworkEngineClient {
    isSinglePlayer: boolean;
    forceServerOverride: boolean;
    ip: string;
    port: number;
    lobby: string;
    nickname: string;
    password: string;
    forceTCPMode: boolean;
}

export interface NetworkEngineServer {
    port: number;
    udpPort: number;
    patchSizeLimitMB: number;
    noHashChecks: boolean;
}

export interface IModLoader64Config {
    ModLoader64: ModLoader64;
    "NetworkEngine.Client": NetworkEngineClient;
    "NetworkEngine.Server": NetworkEngineServer;
}

export interface IModLoaderGuiConfig {
    showAdvancedTab: boolean;
    automaticUpdates: boolean;
    overrideRomFolder: string;
    overrideModFolder: string;
    condaChannels: string[];
}

class ModLoaderGuiConfig implements IModLoaderGuiConfig {
    condaChannels: string[] = [];
    overrideRomFolder: string = "";
    overrideModFolder: string = "";
    showAdvancedTab: boolean = false;
    automaticUpdates: boolean = true;
}

export let config: IModLoader64Config;
export let GUI_config: IModLoaderGuiConfig;

export function LOAD_CONFIG() {
    if (fs.existsSync("./client/ModLoader64-config.json")) {
        config = JSON.parse(fs.readFileSync("./client/ModLoader64-config.json").toString());
    }else{
        fs.writeFileSync("./client/ModLoader64-config.json", ml_template);
        config = JSON.parse(fs.readFileSync("./client/ModLoader64-config.json").toString());
    }
    if (!fs.existsSync("./ModLoader64-GUI-config.json")) {
        fs.writeFileSync("./ModLoader64-GUI-config.json", JSON.stringify(new ModLoaderGuiConfig(), null, 2));
    }
    GUI_config = JSON.parse(fs.readFileSync("./ModLoader64-GUI-config.json").toString());
    masterConfigObject = new ConfigObject();
}

export function SAVE_CONFIG() {
    if (config === undefined) return;
    fs.writeFileSync("./client/ModLoader64-config.json", JSON.stringify(config, null, 2));
    fs.writeFileSync("./ModLoader64-GUI-config.json", JSON.stringify(GUI_config, null, 2));
}

export class ConfigObject {

    // ADV config
    showAdvancedTab: ImGui.boolRef;
    automaticUpdates: ImGui.boolRef;
    IpAddr: ImGui.stringRef;
    port: ImGui.stringRef;
    isSinglePlayer: ImGui.boolRef;
    serverOverride: ImGui.boolRef;
    overrideRomPath: ImGui.stringRef;
    overrideModPath: ImGui.stringRef;
    condaUrls: string[] = [];
    // Main window
    nickname: ImGui.stringRef;
    lobby: ImGui.stringRef;
    password: ImGui.stringRef;
    selectedConsole: ImGui.stringRef;
    // Game Window

    constructor() {
        this.showAdvancedTab = [GUI_config.showAdvancedTab];
        this.automaticUpdates = [GUI_config.automaticUpdates];
        this.IpAddr = [config['NetworkEngine.Client'].ip];
        this.port = [config['NetworkEngine.Client'].port.toString()];
        this.isSinglePlayer = [config['NetworkEngine.Client'].isSinglePlayer];
        this.serverOverride = [config['NetworkEngine.Client'].forceServerOverride];
        this.overrideRomPath = [GUI_config.overrideRomFolder];
        this.overrideModPath = [GUI_config.overrideModFolder];
        //
        this.nickname = [config['NetworkEngine.Client'].nickname];
        this.lobby = [config['NetworkEngine.Client'].lobby];
        this.password = [config['NetworkEngine.Client'].password];
        this.selectedConsole = [config.ModLoader64.selectedConsole]
        //
        this.condaUrls = GUI_config.condaChannels;
    }

    update() {
        GUI_config.showAdvancedTab = this.showAdvancedTab[0];
        GUI_config.automaticUpdates = this.automaticUpdates[0];
        config['NetworkEngine.Client'].ip = this.IpAddr[0];
        config['NetworkEngine.Client'].port = parseInt(this.port[0]);
        config['NetworkEngine.Client'].isSinglePlayer = this.isSinglePlayer[0];
        config['NetworkEngine.Client'].forceServerOverride = this.serverOverride[0];
        GUI_config.overrideRomFolder = this.overrideRomPath[0];
        GUI_config.overrideModFolder = this.overrideModPath[0];
        //
        config['NetworkEngine.Client'].nickname = this.nickname[0];
        config['NetworkEngine.Client'].lobby = this.lobby[0];
        config['NetworkEngine.Client'].password = this.password[0];
        config.ModLoader64.selectedConsole = this.selectedConsole[0];
        //
        GUI_config.condaChannels = this.condaUrls;
        SAVE_CONFIG();
    }

}

export let masterConfigObject: ConfigObject; 