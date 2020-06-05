# Multiple Wall Points Mover (MWPM)

Gives the ability to move all wall endpoints that meet at the same point.
Just hold alt while you let go of an endpoint you've grabbed, and any other endpoints that were sitting at it's original location will follow right along!

# Configurable Settings:
- Reverse Behaviour: Reverses key held behavior so that multiple walls move by default, and key must be used to move a single wall.
- Key Code: Numerical key code to be used. You can use something like https://keycode.info/ to find the code.
- Pixel Offset: Number of pixels to use as an offset if you want to also be able to grab walls endpoints that are close by.
- Delete small walls: If both wall endpoints fall within the Pixel Offset, delete the wall instead of grabbing one endpoint.
- Drag Resistance: Number of pixels you have to move your mouse on an endpoint before it registers as a drag (0 means default).