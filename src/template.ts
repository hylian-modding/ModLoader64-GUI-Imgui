export const template: string = `{
    "vsync": false,
    "viewports": true,
    "colorScheme": "system"
}`;

export const ml_template: string = `{
    "ModLoader64": {
      "rom": "",
      "patch": "",
      "isServer": false,
      "isClient": true,
      "supportedConsoles": [
        "Mupen64Plus"
      ],
      "selectedConsole": "Mupen64Plus",
      "coreOverride": "",
      "disableVIUpdates": false,
      "enableDebugger": false
    },
    "NetworkEngine.Client": {
      "isSinglePlayer": false,
      "forceServerOverride": false,
      "ip": "modloader64.com",
      "port": 9010,
      "lobby": "picture-familiar-94",
      "nickname": "Player",
      "password": "",
      "forceTCPMode": false
    },
    "NetworkEngine.Server": {
      "port": 8082,
      "udpPort": 8082,
      "patchSizeLimitMB": 10,
      "noHashChecks": false
    },
    "Mupen64Plus": {
      "rsp": "mupen64plus-rsp-hle",
      "video": "mupen64plus-video-gliden64",
      "audio": "mupen64plus-audio-sdl",
      "input": "mupen64plus-input-sdl"
    },
    "N64TexturePacks": {
      "texturePackStatus": {}
    }
  }`;