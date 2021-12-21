## What is this all about?

### Got a cheap USB receipt printer?

You probably noticed how difficult can it be to interface with it and print anything useful... :/

- ESC/POS standard is messy and convoluted
- The existing customer-oriented software is largely low-quality or paid / subscription-based
- Open-source solutions are primarily made for devs and are not approachable for avg consumer

### So what do we do about it?

- Leverage existing open-source solutions implementing ESC/POS commands
- Connect the printer via USB to Raspberry Pi Zero W
- Expose a POST endpoint to send print jobs to the printer
- Provide a way to print HTML canvas (rendered as an image) to bypass ESC/POS
- Build a number of presets to simplify generating shopping lists, tables and other common things

## Getting started

- Install Node.js (ARM6 unofficial build for RPi0W)
```
curl -O https://unofficial-builds.nodejs.org/download/release/v${NODE_VER}/node-v${NODE_VER}-linux-armv6l.tar.xz
tar -xf node-v${NODE_VER}-linux-armv6l.tar.xz
```

- Clone the repository
```
git clone https://github.com/dmitryfd/receipt-please.git && cd receipt-please
```

- Install the dependencies
```
sudo apt-get install libudev-dev
```
```
CXXFLAGS="--std=c++14" npm install
```

- Modify the config as needed
```
vim config.js
```

- Create a writeable `uploads` directory
```
mkdir uploads
chmod 777 uploads
```

- Ensure permissions for the USB device
```
echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"0416\", ATTR{idProduct}==\"5011\", MODE=\"0666\"" | sudo tee /etc/udev/rules.d/40-receiptplease.rules > /dev/null
```
```
sudo udevadm control --reload-rules
```
```
sudo udevadm trigger
```

- Run
```
node index.js
```

## What is your hardware setup?

* Raspberry Pi Zero W running (unofficial) Node LTS
  - Connected to Internet via WiFi

* ZJ-5802 printer connected to Pi via USB
  - Bluetooth is also supported, but causes gaps in the images due to insufficient baud rate
  - You could include `escpos-bluetooth-patch` to set up such an adapter in lieu of USB
  
* Any device in the local network can navigate to `http://raspberrypi:3000` and submit prints
  
## Next steps

* Add web-based functionality
   - Weather / stocks / quotes / recipes / ...
   
* Build a simple Android app exposing POST endpoint as a share target

* Allow to render the canvas on the server side
   - Using `node-canvas` library
   
* Allow to take advantage of other ESC/POS commands
   - For the cases where the "default" text styles are preferred
   - Can be easily built-in using capabilities of `node-escpos`
