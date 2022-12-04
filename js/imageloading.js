let IMAGES = {}; // GLOBAL IMAGE MAP: DON'T EDIT
var images_loaded = false;

const image_list = [
  //   { file: "myimage.png", name: "myimage" },
  // <-- Add your sprite in here
];

var images_to_load = image_list.length;

function countLoadedImagesAndLaunchIfReady() {
  images_to_load--;
  if (images_to_load === 0) {
    images_loaded = true;
    console.log("images_loaded: " + images_loaded);
  }
}

function beginLoadingImage(imgVar, fileName) {
  imgVar.onload = countLoadedImagesAndLaunchIfReady;
  imgVar.src = "images/" + fileName;
}

function loadImages() {
  for (var i = 0; i < image_list.length; i++) {
    IMAGES[image_list[i].name] = document.createElement("img");
    beginLoadingImage(IMAGES[image_list[i].name], image_list[i].file);
  }
}

loadImages();
