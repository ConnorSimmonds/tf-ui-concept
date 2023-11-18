import 'phaser';

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 400,
    height: 400,
    backgroundColor: '#4488aa',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var dpadLabels = ["ATTACK", "DEFEND", "SPECIAL", "MOVE", "ITEMS", "FLEE"];
var charLabels = ["CHAR1", "CHAR2", "CHAR3", "CHAR4"];
var buttonLabels = ["SKILL 1", "SKILL 2", "SKILL 3", "SKILL 4", "ITEM 1", "ITEM 2"];
var skillLabels = ["SKILL 1", "SKILL 2", "SKILL 3", "SKILL 4", "SKILL 5", "SKILL 6"];
var menuState = 0
const MENU_STATE = {
    MAIN: 0,
    SKILL: 1,
    TARGET: 2,
    ITEM: 3,
    WAIT: 4,
    MOVE: 5,
    DEFEND: 6,
}

var upButtonPress = 0;
var downButtonPress = 0;
var leftButtonPress = 0;
var rightButtonPress = 0;

var targetIndex = 0;
var menuIndex = 0;


function preload ()
{
    this.load.spritesheet('buttons', 'assets/ui_button.png', { frameWidth: 64, frameHeight: 64});
    this.load.spritesheet('target-arrow', 'assets/target_arrow.png', {frameWidth: 32, frameHeight: 32})
    this.load.spritesheet('move-arrow', 'assets/move_arrow.png', {frameWidth: 32, frameHeight: 32})
    this.load.image('label', 'assets/label.png')
}

function create ()
{
    game.state = this.add.text(200,25,"MAIN", {color: "#fff", align: "center"})
    game.dpad = this.physics.add.staticSprite(100, 300, 'buttons');
    //game.dpad.alpha = 0;
    game.button = Array();
    game.buttonFields = Array();
    for(var i = 0; i < 6; i++){
        game.button[i] = this.physics.add.staticSprite(250 + (32 * Math.floor(i%3)),325 - ((32 * Math.floor(i%2) + 8 * Math.floor(i%3))), 'buttons', 5)
        game.buttonFields[i] = this.add.text(225 + (48 * Math.floor(i%3)),340 - ((80 * Math.floor(i%2) + 8 * Math.floor(i%3))), buttonLabels[i],  {color: "#fff", align: "center"});
    }

    game.confirmCancel = [
        this.add.text(225 + (48 * Math.floor(0%3)),340 - ((80 * Math.floor(0%2) + 8 * Math.floor(0%3))), "CONFIRM",  {color: "#fff", align: "center"}),
        this.add.text(225 + (48 * Math.floor(4%3)),340 - ((80 * Math.floor(4%2) + 8 * Math.floor(5%3))), "CANCEL",  {color: "#fff", align: "center"}),
        this.add.text(72 + (64 * (0)) * -1, 295 + (48 * !(0)) * -1, "CONFIRM", {color: "#fff", align: "center"}),
        this.add.text(72 + (64 * (0)) * 1, 295 + (48 * !(0)) * 1, "CANCEL", {color: "#fff", align: "center"}),
    ]

    game.confirmCancelSkill = [
        this.add.text(225 + (48 * Math.floor(0%3)),340 - ((80 * Math.floor(0%2) + 8 * Math.floor(0%3))), "CONFIRM",  {color: "#fff", align: "center"}),
        this.add.text(225 + (48 * Math.floor(4%3)),340 - ((80 * Math.floor(4%2) + 8 * Math.floor(5%3))), "CANCEL",  {color: "#fff", align: "center"}),
        this.add.text(72 + (64 * (1)) * -1, 295 + (48 * !(1)) * -1, "CANCEL", {color: "#fff", align: "center"}),
        this.add.text(72 + (64 * (1)) * 1, 295 + (48 * !(1)) * 1, "CONFIRM", {color: "#fff", align: "center"}),
    ]

    game.confirmCancel.forEach((field) => {
        field.alpha = 0;
    })

    game.confirmCancelSkill.forEach((field) => {
        field.alpha = 0;
    })
    
    game.cursors = this.input.keyboard.createCursorKeys();
    game.buttons = this.input.keyboard.addKeys('Z,X,C,A,S,D,Q,W');
    game.dpadFields = Array();
    
    // add in the text labels
    for(var i = 0; i < 4; i++)
    {
        var sign = i - 2 > 0 ? 1 : i - 2 == 0 ? 1 : -1
        var odd = i % 2
        game.dpadFields[i] = this.add.text(72 + (64 * (odd)) * sign, 295 + (48 * !(odd)) * sign, dpadLabels[i], {color: "#fff", align: "center"});
    }

    // Target Options!
    game.target = this.physics.add.sprite(50, 150, 'target-arrow');

    this.anims.create({
        key: 'target',
        frames: this.anims.generateFrameNumbers('target-arrow', { start: 0, end: 6 }),
        frameRate: 12,
        repeat: -1
    });

    game.target.anims.play('target');
    game.target.alpha = 0;

    // Move Options!
    game.move_arrow = this.physics.add.sprite(50, 150, 'move-arrow');
    this.anims.create({
        key: 'move',
        frames: this.anims.generateFrameNumbers('move-arrow', { start: 0, end: 6 }),
        frameRate: 12,
        repeat: -1
    });
    game.move_arrow.anims.play('move');
    game.move_arrow.alpha = 0;


    game.labels = Array();
    // Show the labels!
    for(var i = 0; i < 5; i++)
    {
        var label = this.physics.add.staticSprite(0,0,'label')
        var text = this.add.text(-64,0, skillLabels[i],  {color: "#000", align: "center"});
        game.labels[i] = this.add.container(100 + Math.sin(i * Math.PI/4)* 32, 100 + (24 * i));
        game.labels[i].add(label);
        game.labels[i].add(text);
        game.labels[i].alpha = 0;
        if(i == 2)
        {
            game.labels[2].setDepth(1);
        }
    }
}

function setupMain(){
    game.dpadFields.forEach((dpadField) => {
        dpadField.alpha = 1;
    });
    game.buttonFields.forEach((buttonField) => {
        buttonField.alpha = 1;
    })

    game.confirmCancel.forEach((field) => {
        field.alpha = 0;
    })

    game.labels.forEach((field) => {
        field.alpha = 0;
    })

    game.confirmCancelSkill.forEach((field) => {
        field.alpha = 0;
    })
    
    game.target.alpha = 0;
    game.move_arrow.alpha = 0;
    menuState = MENU_STATE.MAIN;
    game.state.setText("MAIN");
    upButtonPress = 0;
    downButtonPress = 0;
}

function setupTarget(){
    game.dpadFields.forEach((dpadField) => {
        dpadField.alpha = 0;
    });
    game.buttonFields.forEach((buttonField) => {
        buttonField.alpha = 0;
    })

    game.confirmCancel.forEach((field) => {
        field.alpha = 1;
    })

    game.labels.forEach((field) => {
        field.alpha = 0;
    })

    game.confirmCancelSkill.forEach((field) => {
        field.alpha = 0;
    })
    

    menuState = MENU_STATE.TARGET;
    game.target.alpha = 1;
    game.state.setText("TARGET");
}

function setupMove(){
    game.dpadFields.forEach((dpadField) => {
        dpadField.alpha = 0;
    });
    game.buttonFields.forEach((buttonField) => {
        buttonField.alpha = 0;
    })

    game.confirmCancel.forEach((field) => {
        field.alpha = 1;
    })

    menuState = MENU_STATE.MOVE;
    game.move_arrow.alpha = 1;
    game.state.setText("MOVE");
}

function setupSkill(){
    game.dpadFields.forEach((dpadField) => {
        dpadField.alpha = 0;
    });
    game.buttonFields.forEach((buttonField) => {
        buttonField.alpha = 0;
    })

    game.labels.forEach((field) => {
        field.alpha = 1;
    })

    game.confirmCancelSkill.forEach((field) => {
        field.alpha = 1;
    })

    menuState = MENU_STATE.SKILL;
    game.state.setText("SKILL");
}

function update()
{
    // super basic input
    if(game.cursors.left.isDown) {
        game.dpad.setFrame(4)
    }
    else if(game.cursors.right.isDown) {
        game.dpad.setFrame(2)
    }
    else if(game.cursors.up.isDown) {
        game.dpad.setFrame(1)
    }
    else if(game.cursors.down.isDown) {
        game.dpad.setFrame(3)
    } else {
        game.dpad.setFrame(0)
    }

    if(game.buttons.Z.isDown){
        game.button[0].setFrame(6);
    } else if(game.buttons.Z.isUp){
        game.button[0].setFrame(5);
    }

    if(game.buttons.X.isDown){
        game.button[4].setFrame(6);
    } else if(game.buttons.X.isUp){
        game.button[4].setFrame(5);
    }
    if(game.buttons.C.isDown){
        game.button[2].setFrame(6);
    } else if(game.buttons.C.isUp){
        game.button[2].setFrame(5);
    }
    if(game.buttons.A.isDown){
        game.button[3].setFrame(6);
    } else if(game.buttons.A.isUp){
        game.button[3].setFrame(5);
    }
    if(game.buttons.S.isDown){
        game.button[1].setFrame(6);
    } else if(game.buttons.S.isUp){
        game.button[1].setFrame(5);
    }
    if(game.buttons.D.isDown){
        game.button[5].setFrame(6);
    } else if(game.buttons.D.isUp){
        game.button[5].setFrame(5);
    }
    switch(menuState)
    {
        case(MENU_STATE.MAIN):{
            if(Phaser.Input.Keyboard.JustDown(game.cursors.left)) {
                menuState = MENU_STATE.DEFEND;
            }
            else if(Phaser.Input.Keyboard.JustDown(game.cursors.right)) {
                setupMove();
            }
            else if(Phaser.Input.Keyboard.JustDown(game.cursors.up)) {
                setupTarget();
                upButtonPress = 3;
            }
            else if(Phaser.Input.Keyboard.JustDown(game.cursors.down)) {
                setupSkill();
            }
            
            if(Phaser.Input.Keyboard.JustDown(game.buttons.Z)){
                setupTarget();
            }
            if(Phaser.Input.Keyboard.JustDown(game.buttons.X)){
                setupTarget();
            }
            if(game.buttons.C.isDown){
                setupTarget();
            }
            if(game.buttons.A.isDown){
                setupTarget();
            }
            if(game.buttons.S.isDown){
                setupTarget();
            }
            if(game.buttons.D.isDown){
                setupTarget();
            }
            break;
        }
        case(MENU_STATE.TARGET):
        {
            if(Phaser.Input.Keyboard.JustDown(game.cursors.left)) {
                leftButtonPress = 1;
            } else if(game.cursors.left.isUp){
                if(leftButtonPress == 1) {
                    targetIndex -= 1;
                    if(targetIndex < 0) {
                        targetIndex = 3;
                    }
                    leftButtonPress = 0;
                    game.target.x = 50 + (100 * targetIndex);
                }
            }

            if(Phaser.Input.Keyboard.JustDown(game.cursors.up)) {
                if(upButtonPress == 0){
                    upButtonPress = 1;
                }
                
            } else if(game.cursors.up.isUp){
                if(upButtonPress == 1) {
                    upButtonPress = 0;
                    setupMain();
                } else {
                    upButtonPress = 0;
                }
            }

            if(Phaser.Input.Keyboard.JustDown(game.cursors.down)) {
                downButtonPress = 1;
            } else if(game.cursors.left.isUp){
                if(downButtonPress == 1) {
                    setupMain();
                    upButtonPress = 0;
                }
            }
            
            if(Phaser.Input.Keyboard.JustDown(game.cursors.right)) {
                rightButtonPress = 1;
            } else if(game.cursors.right.isUp){
                if(rightButtonPress == 1) {
                    targetIndex += 1;
                    if(targetIndex > 3) {
                        targetIndex = 0;
                    }
                    rightButtonPress = 0;
                    game.target.x = 50 + (100 * targetIndex);
                }
            }

            if(Phaser.Input.Keyboard.JustDown(game.buttons.Z)){
                setupMain();
            }
            if(Phaser.Input.Keyboard.JustDown(game.buttons.X)){
                setupMain();
            }

            break;
        }
        case(MENU_STATE.MOVE):
        {
            if(Phaser.Input.Keyboard.JustDown(game.cursors.up)) {
                if(upButtonPress == 0){
                    upButtonPress = 1;
                }
            } else if(game.cursors.up.isUp){
                if(upButtonPress == 1) {
                    upButtonPress = 0;
                    setupMain();
                } else {
                    upButtonPress = 0;
                }
            }

            if(Phaser.Input.Keyboard.JustDown(game.cursors.down)) {
                downButtonPress = 1;
            } else if(game.cursors.left.isUp){
                if(downButtonPress == 1) {
                    setupMain();
                }
            }
            

            if(Phaser.Input.Keyboard.JustDown(game.cursors.left)) {
                leftButtonPress = 1;
            } else if(game.cursors.left.isUp){
                if(leftButtonPress == 1) {
                    targetIndex -= 1;
                    if(targetIndex < 0) {
                        targetIndex = 3;
                    }
                    leftButtonPress = 0;
                    game.move_arrow.x = 50 + (100 * targetIndex);
                }
            }
            
            if(Phaser.Input.Keyboard.JustDown(game.cursors.right)) {
                rightButtonPress = 1;
            } else if(game.cursors.right.isUp){
                if(rightButtonPress == 1) {
                    targetIndex += 1;
                    if(targetIndex > 3) {
                        targetIndex = 0;
                    }
                    rightButtonPress = 0;
                    game.move_arrow.x = 50 + (100 * targetIndex);
                }
            }

            if(Phaser.Input.Keyboard.JustDown(game.buttons.Z)){
                setupMain();
            }
            if(Phaser.Input.Keyboard.JustDown(game.buttons.X)){
                setupMain();
            }
            break;
        }
        case(MENU_STATE.SKILL):{
            if(Phaser.Input.Keyboard.JustDown(game.cursors.up)) {
                menuIndex -= 1;
                if(menuIndex < 0)
                {
                    menuIndex = skillLabels.length - 1;
                }
            }
            else  if(Phaser.Input.Keyboard.JustDown(game.cursors.down)) {
                menuIndex += 1;
                if(menuIndex >= skillLabels.length)
                {
                    menuIndex = 0;
                }
            }

            if(Phaser.Input.Keyboard.JustDown(game.cursors.right)) {
                setupTarget();
            }

            if(Phaser.Input.Keyboard.JustDown(game.cursors.left)) {
                setupMain();
            }


            if(Phaser.Input.Keyboard.JustDown(game.buttons.Z)){
                setupTarget();
            }
            if(Phaser.Input.Keyboard.JustDown(game.buttons.X)){
                setupMain();
            }
            break;
        }
        default: {
            console.log("Not implemented!");
            setupMain();
            break;
        }
    }
   
}