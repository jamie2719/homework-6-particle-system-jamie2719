import {vec3, vec4} from 'gl-matrix';

class Particle {
    curr_p: vec3;
    v: vec3;
    a: vec3;

    constructor(curr: vec3, v: vec3, acc: vec3) {
        this.curr_p = curr;
        this.v = v;
        this.a = acc;
    }

    updateAcceleration(mousePos: vec3, dir: boolean, dragScale: number) {
        if(mousePos != null) {
            var accDir = vec3.create();
            //attract
            if(dir) {
                accDir = vec3.subtract(accDir, mousePos, this.curr_p);
            }
            //repel
            else {
                accDir = vec3.subtract(accDir, this.curr_p, mousePos);
            }

            var length = Math.abs(vec3.length(accDir));
            var accMag = (9.8 * 20) / (10.0 + length*length);
            
            accDir = vec3.normalize(accDir, accDir);
            accDir = vec3.scale(accDir, accDir, accMag);

            //drag force
            var drag = vec3.create();
            drag = vec3.scale(drag, this.v, -dragScale);

            accDir = vec3.add(accDir, accDir, drag);
            this.a = accDir;
        }

    }

    //using euler integration
    updatePosition(time: number) : vec3 {
        var new_p = vec3.create();
        var new_v = vec3.create();
        var acc = vec3.create();

        new_p = vec3.scale(new_p, this.v, time);
        new_p = vec3.add(new_p, this.curr_p, new_p);

        new_v = vec3.scale(new_v, this.a, time);
        new_v = vec3.add(new_v, this.v, new_v);

        this.v = new_v;
        this.curr_p = new_p;

        return this.curr_p;
    }

};

export default Particle;