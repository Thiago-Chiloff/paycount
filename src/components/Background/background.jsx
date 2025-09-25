import Particles from "../Particles/particles";

function Background() {
    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%', 
            zIndex: -1 
        }}>
            <Particles
                particleColors={['#1433bbff', '#764ba2', '#5a67d8']}
                particleCount={50000}
                particleSpread={20}
                speed={0.1}
                particleBaseSize={100}
                moveParticlesOnHover={true}
                alphaParticles={true}
                disableRotation={true}
                particleHoverFactor={2}
            />
        </div>
    );
}

export default Background;