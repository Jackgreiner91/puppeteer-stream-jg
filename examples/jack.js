// NOTICE: install ffmpeg first
// const { launch, getStream } = require("puppeteer-stream");
const { launch, getStream } = require("../dist/PuppeteerStream");
const fs = require("fs");
const { exec } = require("child_process");

async function test() {
	const browser = await launch({
		executablePath:
		//need Chrome to run h264 conetent. 
		'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		args: [
			'--autoplay-policy=no-user-gesture-required', 
			'--enable-automation', //supposed to remove the "this is being used automacially banner? doesnt work?
			'--window-size=1920,1080', //sets the size of the chome tab.
			'--disable-gpu',
			//'--headless=chrome', //makes it so chrome runs in the background.
		],
		defaultViewport: null, // needs to be null or else viewport will be 800 x 600. 
	});

	const page = await browser.newPage();

	//the page you want to capture
	await page.goto("https://live.hovercast.com/expo-2020/broadcasts/sample/output/active");
	
	//stream parameters. I'm experiencing issues with audio, video, and general bitspersecond.
	const stream = await getStream(page, { audio: true, video: true, frameSize: 1000});
	console.log("recording");


	// this will pipe the stream to ffmpeg send it to hoverjackal on twitch
	const ffmpeg = exec(`ffmpeg -i - -v error -c:v libx264 -preset veryfast -tune zerolatency -c:a aac -f flv rtmp://dfw.contribute.live-video.net/app/live_500074979_ceX1oqNA8oOTwtL8x8zLzRrwEzBMyO`);
	ffmpeg.stderr.on("data", (chunk) => {
		console.log(chunk.toString());
	});

	stream.pipe(ffmpeg.stdin);

	setTimeout(async () => {
		await stream.unpipe(ffmpeg);
		ffmpeg.kill();
		console.log("finished");
		
		// this controls how long the stream is. This script orinally recorded an 8 second clip i just added a bunch of 0s. 
	}, 1000 * 1000);
}

test();
