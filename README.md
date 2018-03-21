
# Project 6: Particle System

Demo link: https://jamie2719.github.io/homework-6-particle-system-jamie2719/

To implement the particle system, I created a particle class with a position, velocity, and acceleration. I created a function to update the position of the particle based on some delta time using Euler integration. Then, I added the ability to attract or repel the particles from the mouse's position by pressing alt+click. To accomplish this, I converted the mouse's current pixel space coordinates into world space coordinates by raycasting from the camera to the screen space coordinates of the mouse position. After calculating this ray, I found its intersection with a unit plane centered at the origin facing the camera, and this last step gave me the world space coordinates of the mouse position. Once I had the mouse position in world space, I was able to calculate an acceleration direction, either from the particle position to the mouse position (attract) or from the mouse position to the particle position (repel) and scaled this normalized direction by a value based on the force of gravitational attraction between the two points. In order to keep the particles from dramatically overshooting their target point at each timestep, I added a drag force to this acceleration. The greater the drag force, the quicker the particles would settle into a stable oscillation around the target point, and the tighter around the target point this oscillation would be.

In order to implement the mesh surface attraction, I followed a similar strategy as I did for the interactive forces. For each vertex in the mesh, I calculated the acceleration direction for the corresponding particle to be attracted to it. If there were more particles than vertices in the mesh, the particles would start to repeat themselves so that each vertex had multiple particles clustered around it. If there were more vertices than particles, the particles would cover as many vertices as possible and then the remaining vertices would have no particles attracted to them.

I colored the particles using a procedural color palette based on the cosine palette from class, and the color values of each particle vary based on time and position. The background color also varies with time.

In the GUI, the user can adjust the number of particles displayed on screen (must then press reset to see changes), toggle whether alt-click will attract particles to or repel particles from the current mouse position, adjust the magnitude of the drag force on the particles, choose one of 3 meshes that the particles will be attracted to, and reset the scene back to the original square of particles.


