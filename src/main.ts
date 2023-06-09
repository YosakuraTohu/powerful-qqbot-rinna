import { Config, OnlineStatus, Platform, createClient } from "icqq";

/**
 * 主要配置
 */
const config: Config = {
    log_level: "warn",
    platform: Platform.old_Android,
    ffmpeg_path: "/usr/bin/ffmpeg",
    ffprobe_path: "/usr/bin/ffprobe"
};

const main_client = createClient(config);

/**
  * 登陆事件处理模块
  * 相关的事件Hooks都写在这里
  */
main_client.on("system.login.slider", function (e) {
    console.log("输入ticket：");
    process.stdin.once("data", ticket => main_client.submitSlider(String(ticket).trim()));
});

main_client.on("system.login.qrcode", function (e) {
    console.log("扫码完成后回车继续：");
    process.stdin.once("data", () => main_client.login());
});

main_client.on("system.login.device", function () {
    console.log("请选择验证方式:(1：短信验证   其他：扫码验证)");
    process.stdin.once("data", data => {
        if (data.toString().trim() === "1") {
            main_client.sendSmsCode();
            console.log("请输入手机收到的短信验证码：");
            process.stdin.once("data", code => main_client.submitSmsCode(code.toString().trim()));
        } else {
            console.log("扫码完成后回车继续：");
            process.stdin.once("data", () => main_client.login());
        }
    });
});

/**
 * 系统事件处理模块
 * 除登陆以外的事件的Hooks全部写在这里
 */
main_client.on("system.online", function () {
    main_client.setOnlineStatus(OnlineStatus.Online);
});


/**
 * 文心一言API
 */
async function fetchHitokoto() {
    const response = await fetch('https://v1.hitokoto.cn');
    const { uuid, hitokoto } = await response.json();
    return {
        uuid: uuid as string,
        hitokoto: hitokoto as string
    }
}

/**
 * 聊天事件处理模块
 * 这里提供绑定聊天相关的Hooks
 */
main_client.on("message.private.friend", async function (e) {
    if (e.raw_message === "exit" || e.raw_message === "去休息吧") {
        main_client.logout(false);
        setTimeout(() => process.exit(0), 3000);
    }

    setTimeout(async () => e.reply((await fetchHitokoto()).hitokoto), Math.floor(Math.random() * 5000));
});

main_client.on("message", function (e) {
    console.log(e);
});

/**
 * 导出主模块
 */
export function init(config: { account: number, passwd: string }) {
    main_client.login(config.account, config.passwd);
};