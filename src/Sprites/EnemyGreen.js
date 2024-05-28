class EnemyGreen extends Enemy {

    // x,y - starting sprite location
    // spriteKey - key for the sprite image asset
    constructor(scene, x, y, identifier, rowOnScreen, texture = "spaceSprites1", frame = "enemyGreen3.png") {
        let properties = {
            id: identifier, // unique identifier
            state: "dead", // alive, dying, dead
            health: 40,
            defense: 0, // damage mitigation rate (100 = 100% of damage blocked)
            baseDefense: 0, // base defense to keep track when reverting buffs
            lifetime: 0, // tick counter to use in cycling behavior phases
            row: rowOnScreen, // Row on-screen. 1: front, 2: middle, 3: back, -1: offscreen
            dodge: 0, // bullet dodge chance
            baseDodge: 0, // used for reference when reverting buffs
            buffs: {}, // list of active buffs
            debuffs: {}, // list of active debuffs
            allyInFront: null, // true/false: Has ally or doesnt have ally in front
            allyBehind: null, // link to the closest ally in behind. null indicates it has no ally behind it.
            phaseLifetime: 0, // timer that resets upon completing one entire cycle of phases.
            phase: 0, // standby (0) -> shielding (1) -> repeat (0)
            shootMode: 1, // off (0), normal (1),  special (2)
            shootCooldown: 3, //seconds
            dodgeAttack: 0, // keeps track of counterattack mode of the enemy (Green enemy specific)
            dodgeAttackTimestamp: 0 // timestamp of when the enemy performs a dodge attack
        }

        super(scene, texture, frame, x, y, properties);

        this.scene = scene;
        this.phases = ["standby", "shielding"]; // mostly for informational reference. Not to be used over this.properties.phase
        this.phaseDurations = [540, 360];
        this.phaseTargets = MiscFunctions.calculatePhaseTargets(this.phaseDurations);
        const arrLen = this.phaseTargets.length;
        let randRange = this.phaseTargets[arrLen - 1] - 151;
        const randOffset = Maths.getRandomInt(randRange);
        this.properties.phaseLifetime = randOffset; // randOffset makes the enemy's shooting patterns not synchronized perfectly

        this.createFollowerSprites(scene);
        this.checkPhase();

        return this;
    }

    createFollowerSprites(scene) {

        this.laserCharge1 = scene.add.sprite(0, 0, "laserGreenCharge1");
        let s1 = this.laserCharge1;
        s1.angle = 180;
        s1.setScale(0.55);
        s1.visible = false;

        this.laserCharge2 = scene.add.sprite(0, 0, "laserGreenCharge2");
        let s2 = this.laserCharge2;
        s2.angle = 180;
        s2.setScale(0.55);
        s2.visible = false;
    }

    killThis() {
        let s1 = this.laserCharge1;
        let s2 = this.laserCharge2;
        s1.visible = false;
        s2.visible = false;

        my.score.current += 200;
        super.killThis();
    }

    makeInactive(){
        super.makeInactive();
    }

    update() {
        // Check for class-specific behavior phases:
        this.updatePhase();

        // Parent Enemy class update procedures
        super.update();

        // Move shield with the enemy
        this.updateFollowerMovement();

        this.properties.phaseLifetime++
    }

    updateFollowerMovement() {
        this.laserCharge1.x = this.x;
        this.laserCharge1.y = this.y + 20;

        this.laserCharge2.x = this.x;
        this.laserCharge2.y = this.y + 20;
    }
    // Potential phases for this enemy: 
    // 
    updatePhase() {
        let phaseTime = this.properties.phaseLifetime;
        let phaseTargets = this.phaseTargets;

        this.checkCounterattack();
        this.checkFiring();

        //if (phaseTime % 300 = )

        if (phaseTime < phaseTargets[0]) { // During phase 0: Standby mode

        }
        else if (phaseTime == phaseTargets[0]) { // Transition to phase 1
            this.phaseTransition(1);
        }
        else if (phaseTime < phaseTargets[1]) { // During phase 1: Shield mode

        }
        else if (phaseTime == phaseTargets[1]) { // Transition back to phase 0
            //console.log("Return to phase 0");
            this.phaseTransition(0);
            this.properties.phaseLifetime = 0;
        }

    }

    checkPhase() { // non-continuous version of updatePhase()
        let phaseTime = this.properties.phaseLifetime;
        let phaseTargets = this.phaseTargets;

        if (phaseTime < phaseTargets[0]) { // Transition to phase 0: Standby mode
            this.phaseTransition(0);
        }
        else if (phaseTime < phaseTargets[1]) { // During phase 1: Shield mode
            this.phaseTransition(1);
        }
    }

    phaseTransition(targetPhase) {
        switch (targetPhase) {
            case 0:
                this.properties.phase = 0;
                break;

            case 1:
                this.properties.phase = 1;
                break;

            default:

        }

        return;
    }

    checkCounterattack(){
        const counterattack = true;

        if (this.properties.dodgeAttack == 1){ // counter-attack triggered
            this.properties.dodgeAttack = -1
            this.properties.dodgeAttackTimestamp = my.gameRuntime;
            this.fireLaser(counterattack);
        }
        else if (this.properties.dodgeAttack == -1){ // during counter-attack
            
            if (my.gameRuntime - this.properties.dodgeAttackTimestamp == 10){
                this.fireLaser(counterattack);
            }
            else if (my.gameRuntime - this.properties.dodgeAttackTimestamp == 20){
                this.properties.dodgeAttack = 0;
            }
            
        }
    }

    checkFiring(){
        let phaseTime = this.properties.phaseLifetime;

        // Unconditional continuous firing
        if (this.properties.row < 3){
            let chargePeriod = (phaseTime + 150) % 300;
            if (chargePeriod >= 0 && chargePeriod < 115) {
                this.laserCharge2.visible = true;
            }
            else if ((phaseTime + 35) % 300 == 0) {
                this.laserCharge1.visible = true;
                this.laserCharge2.visible = false;
            }
            else if ((phaseTime + 30) % 300 == 0) {
                this.fireLaser();
            }
            else if ((phaseTime + 20) % 300 == 0) {
                this.fireLaser();
            }
            else if ((phaseTime + 10) % 300 == 0) {
                this.fireLaser();
            }
            else if ((phaseTime + 5) % 300 == 0) {
                this.laserCharge1.visible = false;
                this.laserCharge2.visible = false;
            }
        }
    }

    fireCounterattack(offset){
        for (let bullet in my.projectilesEnemy.greenCountershot) {
            let b = my.projectilesEnemy.greenCountershot[bullet];
            if (b.active == false) {
                b.x = this.x + offset;
                b.y = this.y + 30;

                b.makeActive();
                b.setDamage(10);
                return;
            }
        }
    }

    fireLaser(counterattack = false) {

        if (counterattack == true){
            if (this.properties.row < 4){
                this.fireCounterattack(12);
                this.fireCounterattack(-12);
            }
            return;
        }

        if (this.checkFireOK() == false) {
            //console.log("fire NOT ok");
            return;
        }

        for (let bullet in my.projectilesEnemy.shotGreenMedium) {
            let b = my.projectilesEnemy.shotGreenMedium[bullet];
            if (b.active == false) {
                b.x = this.x;
                b.y = this.y + 30;

                b.makeActive();
                b.setDamage(10);
                return;
            }
        }
    }

    checkFireOK() {
        //console.log("checkFireOK() steps: ");
        //console.log("1");
        if (this.properties.row > 2) return false; // no shooting from back rows
        //console.log("2");
        //if (this.properties.allyInFront == true) return false; // no shooting while allies are in front of it
        //console.log("3");
        if (this.properties.shootMode == 0) return false;// no shooting while shootMode flag is 0
        //console.log("4");
        //if (my.queue.shifting[0] != null) return false; // no shooting while shifting down
        //console.log("5");

        return true;
    }

    addShieldBuff() {
        my.sounds.playAscendingShield(this.scene.sound);
        this.properties.defense = 100;
        this.shieldSprite1.visible = false;
        this.shieldSprite2.visible = true;

    }

    removeShieldBuff() {
        //console.log("removeShieldBuff");
        this.properties.defense = this.properties.baseDefense;
        this.shieldSprite2.visible = false;
    }



}