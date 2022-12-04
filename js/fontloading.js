var fontFace = new FontFace(
  "PressStart2P",
  "url(fonts/PressStart2P-Regular.ttf)"
);

fontFace.load().then((font) => {
  document.fonts.add(font);
  console.log("Font loaded");
});

context.font = "8px PressStart2P";

// if (TRY_TO_MAKE_FONTS_MORE_CRISP) {
//   context.real_fillText = context.fillText;
//   context.fillText = function (text, x, y, scale = 4) {
//     // idea #1: nudge text half a pixel over: +=0.5
//     // result: does not work as hoped - no effect. =(

//     // idea #2: some texts are using width/2 to center
//     // let's make sure coords are integers
//     x = Math.round(x);
//     y = Math.round(y);

//     //console.log("text hack pos="+x+","+y);
//     //context.real_fillText(text,x,y,maxWidth);

//     // idea #3 - render larger on a temp canvas
//     // a temp canvas used to make fonts crisp
//     if (!window.fontcanvas) {
//       // only created the first time, reused after that
//       window.fontcanvas = document.createElement("canvas");
//       fontcanvas.width = canvas.width * scale;
//       fontcanvas.height = canvas.height * scale;
//       window.fontctx = fontcanvas.getContext("2d");
//     }
//     fontctx.clearRect(0, 0, fontcanvas.width, fontcanvas.height);

//     // quadruple the font size
//     let smallsize = parseInt(context.font.split("px")[0]);
//     let bigsize = smallsize * scale;
//     fontctx.font = bigsize + "px PressStart2P";
//     fontctx.fillStyle = context.fillStyle;
//     fontctx.fillText(text, x * scale, y * scale); //,maxWidth);

//     // now copy it while scaling the text bitmap down
//     context.drawImage(
//       fontcanvas,
//       0,
//       0,
//       fontcanvas.width / scale,
//       fontcanvas.height / scale
//     );
//   };
// }
