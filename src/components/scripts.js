import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import * as PIXI from 'pixi.js';
import { io } from 'socket.io-client';
//images
import pink_sprite from '../images/pink_sprite.png';
import pink_effect from '../images/pink_effect.png';
import blue_sprite from '../images/blue_sprite.png';
import blue_effect from '../images/blue_effect.png';
import intro_background from '../images/intro_background.png';
import room_list_panel from '../images/panel1.png';
import check_box_x from '../images/checkbox_x.png';
import earth_image from '../images/earth_image.png';
import intro_font from '../images/hiding_bros.png';
import game_background from '../images/game_background.jpg';
import avatar_image from '../images/avatar_image.png';
import up_image from '../images/up.png';
import down_image from '../images/down.png';
import timeout_background_image from '../images/timeout_background.png';
import timeout_border from '../images/timeout_border.png';
import timeout_front from '../images/timeout_front.png';
import door_image from '../images/door.png';
import user_info_image from '../images/user_info.png';
import home_image from '../images/home.png';
import hp_progress_bar_iamge from '../images/progress_bar.png';
import hp_bar_image from '../images/hp_bar.png';
import connect_disable_image from '../images/connect_disable.png';
import connect_wait_image from '../images/connect_wait.png';
import connect_ready_image from '../images/connect_ready.png';
import ready_button_image from '../images/ready_button.png';
import ready_click_image from '../images/ready_click.png';
import skill_button_image from '../images/skill_button.png';
import skill_used_image from '../images/skill_used.png';

import retire from '../images/retire.png';
import lose_image from '../images/you_lose.png';
import win_image from '../images/you_win.png';
import arrow from '../images/arrow.png';
import shoot1 from '../images/circle_explode.png';
//
function Scripts({account}) {
    axios.defaults.withCredentials = true;
    const roomNamePostRequest = async () => {
        await axios.post("http://localhost:3001/roomtext", { address: account, text: roomNameText })
    }
    const [visible, setVisible] = useState(false);
    const [roomNameText, setRoomNameText] = useState("");
    const handleChange = e => {
        setRoomNameText(e.target.value)
    }
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    useEffect(() => {
        document.fonts.ready.then( function () {
            let roomNames = [];
            let connectionWaitTexutre = PIXI.Texture.from(connect_wait_image);
            let connectionReadyTexture = PIXI.Texture.from(connect_ready_image);
            let position;
            let firstTurn = true;
            let myTurn = false;
            let myHide = false;
            let myOpen = false;
            let server = io('https://hiding-bros.herokuapp.com/game', { transports : ['websocket'] }, { autoConnect: false });
            server.connect();

            const refresh = () => {
                server.emit('reqRoomNames');
            };
            server.on('roomText', (text) => {
                server.emit('createRoom', text);
            })
            server.on('resRoomNames', (data) => {
                roomNames = data;
                console.log(roomNames);
            });
            server.on('roomIsFull', (data) => {
                //방 가득참 data = "방이 가득찼습니다."
            })
            server.on('enterRoom', (data) => {
                position = data.position;
                console.log("enter " + position);
                for (let i = 0; i < mainScreen.children.length; i++) {
                    mainScreen.removeChild(mainScreen.children[i]);
                };
                for (let i = 0; i < gameScreen.children.length; i++) {
                    gameScreen.removeChild(gameScreen.children[i]);
                };
                gameStart();
                console.log(data);
                if (!data.connections[0]) {
                    gameScreen.removeChild(userInfo1);
                    gameScreen.removeChild(userInfoRect1);    
                }
                if (!data.connections[1]) {
                    gameScreen.removeChild(userInfo2);
                    gameScreen.removeChild(userInfoRect2);
                }
                if (data.connections[0] && position) {
                    userInfo1.removeChild(ready1);
                    userInfo1.removeChild(skillText1);
                    userInfo1.removeChild(skillButton1);
                }
                if (data.connections[1] && !position) {
                    userInfo2.removeChild(ready2);
                    userInfo2.removeChild(skillText2);
                    userInfo2.removeChild(skillButton2);
                }
            })
            server.on('leaveRoom', (player) => {
                cast = false;
                firstTurn = true;
                myTurn = false;
                myHide = false;
                myOpen = false; 
                console.log("leave " + player); 
                if (!player) {
                    gameScreen.removeChild(userInfo1);
                    gameScreen.removeChild(userInfoRect1);
                } else {
                    if (player) {
                        gameScreen.removeChild(userInfo2);
                        gameScreen.removeChild(userInfoRect2);
                    }
                }
            })
            server.on('ready', (readyArr) => {
                console.log(readyArr);
                if (readyArr[0]) {
                    connectionReady1.texture = connectionReadyTexture;
                } else {
                    if (!readyArr[0]) {
                        connectionReady1.texture = connectionWaitTexutre;
                    }
                }
                if (readyArr[1]) {
                    connectionReady2.texture = connectionReadyTexture;
                } else {
                    if (!readyArr[1]) {
                        connectionReady2.texture = connectionWaitTexutre;
                    }
                }
            })
            server.on('giveTurn', (turn) => {
                if (firstTurn){
                    createPlayer();
                    createEnemy();
                }
                console.log(turn+ " " + position);
                
                if (turn == position) {
                    myTurn = true;
                    gameScreen.removeChild(rect);
                    gameScreen.removeChild(userInfoRect1);
                    gameScreen.removeChild(userInfoRect2);
                    if (!position) {
                        myHide = true;
                        console.log("myhide1");
                        gameScreen.addChild(userInfoRect1);
                    } else {
                        if (position) {
                            myHide = true;
                            console.log("myhide2");
                            gameScreen.addChild(userInfoRect2);
                        }
                    }
                } else {
                    gameScreen.removeChild(rect);
                    gameScreen.removeChild(userInfoRect1);
                    gameScreen.removeChild(userInfoRect2);
                    if (!turn) {
                        console.log("enemyhide1");
                        gameScreen.addChild(userInfoRect1);
                    } else {
                        if (turn) {
                            console.log("enemyhide2");
                            gameScreen.addChild(userInfoRect2);
                        }
                    }
                }
            })
            server.on('hide', (data) => {
                myHide = false;
                if (!data) {
                    gameScreen.removeChild(enemy);
                } else {
                    setTimeout(() => {
                        if (door[myX + 7 * myY].open) {
                            player.alpha = 1;
                        } else {
                            player.alpha = 0.5;
                        }
                    }, 100);
    
                    if (position === data.pos) {
                        player.alpha = 0.5;
                        playerArrow.x = 485 + data.x * 98;
                        playerArrow.y = 100 + data.y * 95;
                        player.x = 488 + data.x * 98;
                        player.y = 140 + data.y * 95;                            
                        gameScreen.removeChild(playerArrow);
                        gameScreen.removeChild(player);
                        gameScreen.addChild(playerArrow);
                        gameScreen.addChild(player);
                        player.play();
                    } else {
                        if (position !== data.pos) {
                            //적꺼
                            if (door[data.x + 7 * data.y].open) {
                                enemy.x = 488 + data.x * 98;
                                enemy.y = 140 + data.y * 95;           
                                gameScreen.removeChild(enemy);
                                gameScreen.addChild(enemy);
                            }
                        }
                    }
                }
            })
            server.on('open', (data) => {
                myOpen= false;
                myTurn = false;
                let x = data.x;
                let y = data.y;
                if (!(door[x + 7 * y].open)) {
                    door[x + 7 * y].open = true;
                    door[x + 7 * y].textures = playerSheet.opening;
                    door[x + 7 * y].loop = false;
                    door[x + 7 * y].animationSpeed = 1.4;
                    door[x + 7 * y].play();
                }
                if (door[myX + 7 * myY].open) {
                    player.alpha = 1;
                }
                if (data.shoot == position) {
                    //쏜 사람이 나라면
                    //적이 맞는모습
                    if (!data.pos) {
                        //맞는 위치가 1p일 때
                        for (let x = 0; x < 41; x++) {
                            setTimeout(() => {
                                hp1.x += 1;
                            }, 100);
                        }
                        gameScreen.removeChild(enemy);
                        enemy.textures = playerSheet.pink_hurt;
                        enemy.x = 488 + data.x * 98;
                        enemy.y = 140 + data.y * 95;  
                        enemy.animationSpeed = 0.15;
                        enemy.loop = false;
                        gameScreen.addChild(enemy);
                        enemy.play();
                        setTimeout(() => {
                            enemy.textures = playerSheet.pink_idle;
                            enemy.loop = true;
                            gameScreen.removeChild(enemy);
                            gameScreen.addChild(enemy);
                            enemy.play();
                        }, 200);
                    } else {
                        if (!data.pos) {
                            gameScreen.removeChild(enemy);
                            enemy.x = 488 + data.x * 98;
                            enemy.y = 140 + data.y * 95;  
                            enemy.animationSpeed = 0.15;
                            gameScreen.addChild(enemy);
                        }
                        if (data.pos) {
                            for (let x = 0; x < 41; x++) {
                                setTimeout(() => {
                                    hp2.x += 1;
                                }, 100);
                            }
                            gameScreen.removeChild(enemy);
                            enemy.textures = playerSheet.blue_hurt;
                            enemy.x = 488 + data.x * 98;
                            enemy.y = 140 + data.y * 95;  
                            enemy.animationSpeed = 0.15;
                            enemy.loop = false;
                            gameScreen.addChild(enemy);
                            enemy.play();
                            setTimeout(() => {
                                enemy.textures = playerSheet.blue_idle;
                                enemy.loop = true;
                                gameScreen.removeChild(enemy);
                                gameScreen.addChild(enemy);
                                enemy.play();
                            }, 200);
                        }
                    }
                }
                if (data.selfOpen) {
                    gameScreen.removeChild(enemy);
                    enemy.x = 488 + data.x * 98;
                    enemy.y = 140 + data.y * 95;  
                    enemy.animationSpeed = 0.15;
                    gameScreen.addChild(enemy);
                }
                shoot.x = 465 + x * 98;
                shoot.y = 110 + y * 95;
                shoot.textures = playerSheet.shoot1;
                shoot.play();
                gameScreen.removeChild(shoot);
                gameScreen.addChild(shoot);
            })
            function gameProgress() {
                let winTexture = PIXI.Texture.from(win_image);
                let loseTexture = PIXI.Texture.from(lose_image);
                result = new PIXI.Sprite(winTexture);
                result.position.set(app.renderer.width/2, app.renderer.height/2);
                result.pivot.set(result.width/2, result.height/2);
                result.scale.set(0.6);
                result.texture = winTexture;
                result.texture = loseTexture;
                server.on('lose', (connections) => {
                    setTimeout(() => {
                        cast = false;
                        firstTurn = true;
                        myTurn = false;
                        myHide = false;
                        myOpen = false;    
                    }, 100);
                    lose(connections);
                })
                server.on('win', (data) => {
                    setTimeout(() => {
                        cast = false;
                        firstTurn = true;
                        myTurn = false;
                        myHide = false;
                        myOpen = false;    
                    }, 10);
                    win(data);
                })
            }
            server.on('hit', (data) => {
                myOpen= false;
                myTurn = false;
                let x = data.x;
                let y = data.y;
                console.log("hit " + data.pos + data.shoot + " " + position);
                //data.pos = 맞은사람, data.shoot = 쏜사람
                if (!(door[x + 7 * y].open)) {
                    door[x + 7 * y].open = true;
                    door[x + 7 * y].textures = playerSheet.opening;
                    door[x + 7 * y].loop = false;
                    door[x + 7 * y].animationSpeed = 1.4;
                    door[x + 7 * y].play()
                }
                shoot.x = 465 + x * 98;
                shoot.y = 110 + y * 95;
                shoot.textures = playerSheet.shoot1;
                shoot.play();
                gameScreen.removeChild(shoot);
                gameScreen.addChild(shoot);
                if (data.shoot == position) {
                    //쏜 사람이 나라면
                    //적이 맞는모습
                    if (!data.pos) {
                        //맞는 위치가 1p일 때
                        gameScreen.removeChild(enemy);
                        enemy.textures = playerSheet.pink_hurt;
                        enemy.x = 488 + data.x * 98;
                        enemy.y = 140 + data.y * 95;  
                        enemy.animationSpeed = 0.15;
                        enemy.loop = false;
                        gameScreen.addChild(enemy);
                        enemy.play();
                        setTimeout(() => {
                            enemy.textures = playerSheet.pink_idle;
                            enemy.loop = true;
                            gameScreen.removeChild(enemy);
                            gameScreen.addChild(enemy);
                            enemy.play();
                        }, 200);
                        for (let x = 0; x < 41; x++) {
                            setTimeout(() => {
                                hp1.x += 1;
                            }, 100);
                        }
                    } else {
                        if (data.pos) {
                            gameScreen.removeChild(enemy);
                            enemy.textures = playerSheet.blue_hurt;
                            enemy.x = 488 + data.x * 98;
                            enemy.y = 140 + data.y * 95;  
                            enemy.animationSpeed = 0.15;
                            enemy.loop = false;
                            gameScreen.addChild(enemy);
                            enemy.play();
                            setTimeout(() => {
                                enemy.textures = playerSheet.blue_idle;
                                enemy.loop = true;
                                gameScreen.removeChild(enemy);
                                gameScreen.addChild(enemy);
                                enemy.play();
                            }, 200);
                            for (let x = 0; x < 41; x++) {
                                setTimeout(() => {
                                    hp2.x += 1;
                                }, 100);
                            }
                        }
                    }
                }
                else {
                    if (data.pos == position) {
                        //내가 맞았다면
                        //내가 맞는모습
                        if (!data.pos) {
                            //그 위치가 1p라면
                            for (let x = 0; x < 41; x++) {
                                setTimeout(() => {
                                    hp1.x += 1;
                                }, 100);
                            }
                            player.alpha = 1;
                            player.textures = playerSheet.pink_hurt;
                            player.play();
                            setTimeout(() => {
                                player.textures = playerSheet.pink_idle;
                                player.loop = true;
                                gameScreen.removeChild(player);
                                gameScreen.addChild(player);
                                player.play();
                            }, 200);
                        } else {
                            if (data.pos) {
                                for (let x = 0; x < 41; x++) {
                                    setTimeout(() => {
                                        hp2.x += 1;
                                    }, 100);
                                }
                                player.alpha = 1;
                                player.textures = playerSheet.blue_hurt;
                                player.play();
                                setTimeout(() => {
                                    player.textures = playerSheet.blue_idle;
                                    player.loop = true;
                                    gameScreen.removeChild(player);
                                    gameScreen.addChild(player);
                                    player.play();
                                }, 200);
                            }
                        }
                    }
                }
            })

            refresh();
            const keyHandler = (event) => {
                if (roomListPanel.length !== 0) {
                    if (event.deltaY > 0) {
                        for (let i = 0; i < roomNames.length; i++) {
                            roomListPanel[i].y += 15;
                            roomText[i].y += 15;   
                            roomListRect.y += 15;
                        }
                    } else if (event.deltaY < 0) {
                        for (let i = 0; i < roomNames.length; i++) {
                            roomListPanel[i].y -= 15;
                            roomText[i].y -= 15;  
                            roomListRect.y -= 15; 
                        }
                    }
                }
                if (mainScreen.visible = true) {    
                    mainScreen.addChild(introBlackBackground);
                    mainScreen.addChild(frame);
                    mainScreen.addChild(lobbyText);
                    mainScreen.addChild(roomMake);
                    mainScreen.addChild(roomRefresh);
                    mainScreen.addChild(roomInfo);
                }
            }
            window.addEventListener("keyup", keyHandler);
            window.addEventListener("click", keyHandler);
            document.body.addEventListener("wheel", keyHandler);
            let delay = false;
            let introBlackBackground;
            let frame;
            let lobbyText;
            let roomMake;
            let roomRefresh;
            let roomInfo;
            let roomListRect;
            let roomListPanelTexture = new PIXI.Texture.from(room_list_panel);
            let roomListPanel = [];
            let roomText = [];
            let myX;
            let myY;
            let cast;
            let userInfo1;
            let userInfo2;
            let userInfoRect1;
            let userInfoRect2;
            let connectionReady1;
            let connectionReady2;
            let hp1;
            let hp2;
            let ready1;
            let skillText1;
            let skillButton1;
            let ready2;
            let skillText2;
            let skillButton2;
            let player;
            let playerPick;
            let playerArrow;
            let enemy;
            let enemyArrow;
            let door = [];
            let rect;
            let playerSheet = {};
            let shoot;
            let result;
            
            let pointerIsDown = false;
            let pointerIsOver = false;

            const app = new PIXI.Application(
                {
                    width: 1600,
                    height: 800,
                    backgroundColor: 0x000000,
                    transparent: false,
                    antialias: true,
                }
            )
            
            {document.body.appendChild(app.view)}
            
            app.loader
            .add('room_list_panel', room_list_panel)
            .add('font1', '../font/editundo.ttf')
            .add('pink_sprite', pink_sprite)
            .add('pink_effect', pink_effect)
            .add('blue_sprite', blue_sprite)
            .add('blue_effect', blue_effect)
            .add('background_image', game_background)
            .add('door_image', door_image)
            .add('arrow', arrow)
            .add('shoot1', shoot1)
            .load(setup);

            function setup() {
                createMain();
                createUI();
                createPlayerSheet('pink');
                createPlayerSheet('blue');
                createShootSheet();
                createDoorSheet();
                for (let y = 0; y < 7; y++) {
                    for (let x = 0; x < 7; x++) {
                        createDoor(x, y);
                    }
                }
                createShoot();
                createArrow();
                gameProgress();
                const animatedArrow = () => {
                    playerArrow.y += Math.sin(Date.now() / 300) / 10;
                    enemyArrow.y += Math.sin(Date.now() / 300) / 10;
                }
                app.ticker.add(animatedArrow);
            }

            let mainScreen = new PIXI.Container();
            let gameScreen = new PIXI.Container();
            
            mainScreen.visible = true;
            gameScreen.visible = false;

            app.stage.addChild(mainScreen);
            app.stage.addChild(gameScreen);

            const createMain = () => {
                let introBackgroundTexture = PIXI.Texture.from(intro_background);
                let introBackground = new PIXI.TilingSprite(introBackgroundTexture, 1600, 800);
                introBackground.tileScale.set(7);
                introBackground.alpha = 0.7;
                mainScreen.addChild(introBackground);
                let earthTexture = PIXI.Texture.from(earth_image);
                let earth = new PIXI.Sprite(earthTexture);
                earth.scale.set(6);
                mainScreen.addChild(earth);
                earth.position.set(500, 0);
                let introFontTexture = PIXI.Texture.from(intro_font);
                let introFont = new PIXI.Sprite(introFontTexture);
                introFont.position.set(400, 340);
                mainScreen.addChild(introFont);
                let introText = new PIXI.Text("- 아무키나 눌러주세요 -");
                introText.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 40,
                    fontFamily: 'font2',
                })
                introText.position.set(570, 730);
                const animatedIntro = (delta) => {
                    introText.alpha = Math.sin(Date.now() / 400) * 100;
                    introBackground.tilePosition.x += delta * 2;
                    introBackground.tilePosition.y += delta * 1;
                }
                app.ticker.add(animatedIntro);
                mainScreen.addChild(introText);
                introBlackBackground = new PIXI.Graphics();
                introBlackBackground.beginFill(0x000000);
                introBlackBackground.lineStyle(2, 0xFFFFFF, 1);
                introBlackBackground.drawRect(0, 0, 1600, 800);
                introBlackBackground.alpha = 0.7;
                
                frame = new PIXI.Graphics();
                frame.beginFill(0xD8C89B);
                frame.lineStyle({ color: 0x7E562B, width: 4, alignment: 0 });
                frame.drawRect(0, 0, 800, 750);
                frame.position.set(app.renderer.width / 2, app.renderer.height / 2);
                frame.pivot.set(frame.width / 2, frame.height / 2);

                lobbyText = new PIXI.Text("대기방");
                lobbyText.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 50,
                    fontFamily: 'font2',
                });

                lobbyText.position.set(app.renderer.width / 2, 120);
                lobbyText.pivot.set(lobbyText.width / 2, lobbyText.height / 2);

                roomMake = new PIXI.Text("방 만들기");
                roomMake.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 25,
                    fontFamily: 'font2',
                });
                roomMake.position.set(630, 700);
                roomMake.interactive = true;
                roomMake.buttonMode = true;
                roomMake.on('pointerup', make);
                function make() {
                    //setVisible(true);
                    //setRoomNameText();
                    server.emit('createRoom', account);
                }

                roomRefresh = new PIXI.Text("새로고침");
                roomRefresh.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 25,
                    fontFamily: 'font2',
                });
                roomRefresh.position.set(840, 700);
                roomRefresh.interactive = true;
                roomRefresh.buttonMode = true;
                roomRefresh.on('pointerup', lobbyRefresh);
                function lobbyRefresh() {
                    for (let i = 0; i < roomNames.length; i++) {
                        maskContainer.removeChild(roomListPanel[i]);
                        maskContainer.removeChild(roomText[i]);
                    }
                    refresh();
                    setTimeout(() => {
                        for (let i = 0; i < roomNames.length; i++) {
                            createRoomList(i, roomNames[i]);   
                        }
                    }, 1000)                
                }
                roomInfo = new PIXI.Text(
                    `
                    현재사용자:
                    진행상태: 
                    `);
                roomInfo.style = new PIXI.TextStyle({
                    fill: 0xFFFF00,
                    fontSize: 25,
                    fontFamily: 'font2',
                });
                roomInfo.position.set(650, 330);

                let mask = new PIXI.Graphics();
                mask.beginFill(0x888888);
                mask.drawRect(0, 0, 350, 500);
                mask.endFill();
                let maskContainer = new PIXI.Container();
                maskContainer.mask = mask;
                maskContainer.pivot.set(-20, -150);
                maskContainer.addChild(mask);
                frame.addChild(maskContainer);
                
                function createRoomList(index, data) {
                    roomListRect = new PIXI.Graphics();
                    roomListRect.lineStyle(2, 0xFA99FF, 1);
                    roomListRect.drawRect(440, 195, 320, 80);
                    roomText[index] = new PIXI.Text(data.connections + " " + data.name);
                    roomText[index].style = new PIXI.TextStyle({
                        fill: 0x401248,
                        fontSize: 18,
                        fontFamily: 'font2',
                    });
                    roomText[index].position.set(40, 55);
                    roomText[index].y += index * 102;
                    roomListPanel[index] = new PIXI.Sprite(roomListPanelTexture);
                    roomListPanel[index].scale.set(0.8, 0.8);
                    roomListPanel[index].y += index * 102;
                    roomListPanel[index].interactive = true;
                    roomListPanel[index].buttonMode = true;
                    roomListPanel[index].on("pointerover", pointerOver);
                    roomListPanel[index].on("pointerout", pointerOut);
                    roomListPanel[index].on("pointerup", pointerUp);
                    maskContainer.addChild(roomListPanel[index]);
                    maskContainer.addChild(roomText[index]);
                    function pointerOver() {
                        roomInfo.text = 
                        `
                    현재사용자:
                    1. ${data.nicknames[0]}
                    2. ${data.nicknames[1]}
                    진행상태: 
                    waiting
                        `;
                        roomListRect.y = roomListPanel[index].y;
                        mainScreen.addChild(roomListRect);
                    }

                    function pointerOut() {
                        if (!pointerIsDown) {
                            pointerIsOver = false;
                        }
                        mainScreen.removeChild(roomListRect);
                    }

                    function pointerUp() {
                        console.log(data.id);
                        server.emit('joinRoom', data.id);
                    }
                }
            }

            const gameStart = () => {
                if(mainScreen.visible = true) {
                    mainScreen.visible = false;
                    gameScreen.visible = true;
                    
                    createUI();
                    app.loader.load(setup);
                }
            }

            const createUI = () => {
                let gameBackgroundTexture = PIXI.Texture.from(game_background);
                let gameBackground = new PIXI.TilingSprite(gameBackgroundTexture, 1600, 800);
                gameBackground.tileScale.set(1.1);
                gameScreen.addChild(gameBackground);
                let gameBlackBackground = new PIXI.Graphics();
                gameBlackBackground.beginFill(0x001500);
                gameBlackBackground.lineStyle(2, 0xFFFFFF, 1);
                gameBlackBackground.drawRect(450, 80, 686, 665);
                gameScreen.addChild(gameBlackBackground);

                let homeTexture = PIXI.Texture.from(home_image);
                let home = new PIXI.Sprite(homeTexture);
                home.scale.set(0.7);
                home.interactive = true;
                home.buttonMode = true;
                home.on("pointerup", homePointerUp);
                function homePointerUp() {
                    cast = false;
                    firstTurn = true;
                    myTurn = false;
                    myHide = false;
                    myOpen = false; 
                    mainScreen.visible = true;
                    gameScreen.visible = false;
                    server.emit('leaveRoom');
                    for (let i = 0; i < mainScreen.children.length; i++) {
                        mainScreen.removeChild(mainScreen.children[i]);
                    };
                    for (let i = 0; i < gameScreen.children.length; i++) {
                        gameScreen.removeChild(gameScreen.children[i]);
                    };
                    createMain();
                }
                home.position.set(app.renderer.width - home.width - 10, 10);
                gameScreen.addChild(home);

                let upTexture = PIXI.Texture.from(up_image);
                let up = new PIXI.Sprite(upTexture);
                up.scale.set(1.1);
                up.position.set(0, 745);
                gameScreen.addChild(up);
                //
                userInfoRect1 = new PIXI.Graphics();
                userInfoRect1.lineStyle(12, 0x49FF33, 1);
                userInfoRect1.drawRect(41, 131, 360, 590);
                userInfoRect2 = new PIXI.Graphics();
                userInfoRect2.lineStyle(12, 0x49FF33, 1);
                userInfoRect2.drawRect(1191, 131, 360, 590);
                
                let userInfoTexture = PIXI.Texture.from(user_info_image);
                userInfo1 = new PIXI.Sprite(userInfoTexture);
                userInfo1.scale.set(2);
                userInfo1.position.set(40, 130);
                gameScreen.addChild(userInfo1);

                userInfo2 = new PIXI.Sprite(userInfoTexture);
                userInfo2.scale.set(2);
                userInfo2.position.set(1190, 130);
                gameScreen.addChild(userInfo2);

                let avatarTexture = PIXI.Texture.from(avatar_image);
                let avatar1 = new PIXI.Sprite(avatarTexture);
                avatar1.scale.set(0.1);
                avatar1.position.set(53, 55);
                userInfo1.addChild(avatar1);

                let connectionDisableTexture = PIXI.Texture.from(connect_disable_image);
                let connectionWaitTexutre = PIXI.Texture.from(connect_wait_image);
                let connectionReadyTexture = PIXI.Texture.from(connect_ready_image);
                connectionReady1 = new PIXI.Sprite(connectionWaitTexutre);
                connectionReady1.scale.set(0.3);
                connectionReady1.position.set(78, 13);
                userInfo1.addChild(connectionReady1);
                
                let user1NickName = new PIXI.Text("");
                user1NickName.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 12,
                    fontFamily: 'font2',
                });
                userInfo1.addChild(user1NickName);
                user1NickName.position.set(91, 140);
                user1NickName.pivot.x = user1NickName.width/2;

                
                
                let hpBackgroundTexture = PIXI.Texture.from(hp_progress_bar_iamge);
                let hpBackground1 = new PIXI.Sprite(hpBackgroundTexture);
                hpBackground1.scale.set(0.4);
                hpBackground1.position.set(25 , 170);
                userInfo1.addChild(hpBackground1);

                const hpMaskGraphic1 = new PIXI.Graphics();
                hpMaskGraphic1.beginFill(0xffffff, 0.5);
                hpMaskGraphic1.drawRoundedRect(28, 170, 123, 20, 40);
                userInfo1.addChild(hpMaskGraphic1);
                let hpMask1 = new PIXI.Container();
                hpMask1.mask= hpMaskGraphic1;
                userInfo1.addChild(hpMask1);

                let hpBarTexture = PIXI.Texture.from(hp_bar_image);
                hp1 = new PIXI.Sprite(hpBarTexture);
                hp1.scale.set(0.4);
                hp1.position.set(25 , 169);
                hpMask1.addChild(hp1);

                let readyTexture = PIXI.Texture.from(ready_button_image);
                ready1 = new PIXI.Sprite(readyTexture);
                ready1.scale.set(0.4);
                ready1.interactive = true;
                ready1.buttonMode = true;
                ready1.on('pointerup', ready1PointerUp);
                function ready1PointerUp() {
                    if (!delay) {
                        delay = true;
                        if(!position && connectionReady1.texture == connectionWaitTexutre) {
                            server.emit('ready', {pos: 0, ready: true});
                        } else {
                            if (!position && connectionReady1.texture == connectionReadyTexture) {
                                server.emit('ready', {pos: 0, ready: false});
                            }
                        }
                        setTimeout(() => {   
                            delay = false;
                        }, 200)
                    } 
                    
                    
                }
                userInfo1.addChild(ready1);

                let readyClickTexture = PIXI.Texture.from(ready_click_image);
                //ready1.texture = readyClickTexture;
                skillText1 = new PIXI.Text("SKILL");
                skillText1.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 15,
                    fontFamily: 'font2',
                })
                skillText1.position.set(91, 200);
                skillText1.pivot.x = skillText1.width/2;
                userInfo1.addChild(skillText1);
                let skillButtonTexture = PIXI.Texture.from(skill_button_image);
                let skillUsedTexture = PIXI.Texture.from(skill_used_image);
                skillButton1 = new PIXI.Sprite(skillButtonTexture);
                skillButton1.scale.set(0.5);
                skillButton1.position.set(65, 220);
                skillButton1.interactive = true;
                skillButton1.buttonMode = true;
                skillButton1.on('pointerup', skill1PointerUp);
                function skill1PointerUp() {
                    let skillUsed = false;
                    if (myTurn && !skillUsed) {
                        skillButton1.texture = skillUsedTexture;
                        cast = true;
                        skillUsed = true;
                    }
                }
                userInfo1.addChild(skillButton1);
                //
                let avatar2 = new PIXI.Sprite(avatarTexture);
                avatar2.scale.set(0.1);
                avatar2.position.set(53, 55);
                userInfo2.addChild(avatar2);

                connectionReady2 = new PIXI.Sprite(connectionWaitTexutre);
                connectionReady2.scale.set(0.3);
                connectionReady2.position.set(78, 13);
                userInfo2.addChild(connectionReady2);
                
                let user2NickName = new PIXI.Text("");
                user2NickName.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 12,
                    fontFamily: 'font2',
                });
                userInfo2.addChild(user2NickName);
                user2NickName.position.set(91, 140);
                user2NickName.pivot.x = user2NickName.width/2;

                let hpBackground2 = new PIXI.Sprite(hpBackgroundTexture);
                hpBackground2.scale.set(0.4);
                hpBackground2.position.set(25 , 170);
                userInfo2.addChild(hpBackground2);

                const hpMaskGraphic2 = new PIXI.Graphics();
                hpMaskGraphic2.beginFill(0xffffff, 0.5);
                hpMaskGraphic2.drawRoundedRect(28, 170, 123, 20, 40);
                userInfo2.addChild(hpMaskGraphic2);
                let hpMask2 = new PIXI.Container();
                hpMask2.mask= hpMaskGraphic2;
                userInfo2.addChild(hpMask2);

                hp2 = new PIXI.Sprite(hpBarTexture);
                hp2.scale.set(0.4);
                hp2.position.set(25 , 169);
                hpMask2.addChild(hp2);

                ready2 = new PIXI.Sprite(readyTexture);
                ready2.scale.set(0.4);
                ready2.interactive = true;
                ready2.buttonMode = true;
                ready2.on('pointerup', ready2PointerUp);
                function ready2PointerUp() {
                    delay = true;
                    if(position && connectionReady2.texture === connectionWaitTexutre) {
                        server.emit('ready', {pos: 1, ready: true});
                    } else {
                        if (position && connectionReady2.texture === connectionReadyTexture) {
                            server.emit('ready', {pos: 1, ready: false});
                        }
                    }
                    setTimeout(() => {
                        delay = false;
                    }, 200);
                }
                userInfo2.addChild(ready2);
                //ready1.texture = readyClickTexture;
                skillText2 = new PIXI.Text("SKILL");
                skillText2.style = new PIXI.TextStyle({
                    fill: 0xFFFFFF,
                    fontSize: 15,
                    fontFamily: 'font2',
                })
                skillText2.position.set(91, 200);
                skillText2.pivot.x = skillText2.width/2;
                userInfo2.addChild(skillText2);
                skillButton2 = new PIXI.Sprite(skillButtonTexture);
                skillButton2.scale.set(0.5);
                skillButton2.position.set(65, 220);
                skillButton2.interactive = true;
                skillButton2.buttonMode = true;
                skillButton2.on('pointerup', skill2PointerUp);
                function skill2PointerUp() {
                    skillButton2.texture = skillUsedTexture;
                }
                userInfo2.addChild(skillButton2);
                //
                let timetoutBackgroundTexture = PIXI.Texture.from(timeout_background_image);
                let timeoutBackground = new PIXI.Sprite(timetoutBackgroundTexture);
                timeoutBackground.position.set(app.renderer.width/2 - timeoutBackground.width/2, 7);
                let timeoutBorderTexture = PIXI.Texture.from(timeout_border);
                let timeoutBorder = new PIXI.Sprite(timeoutBorderTexture);
                timeoutBorder.position.set(app.renderer.width/2 - timeoutBorder.width/2 + 2, 5);
                let timeoutFrontTexture = PIXI.Texture.from(timeout_front);
                let timeoutFront = new PIXI.Sprite(timeoutFrontTexture);
                timeoutFront.scale.set(1.1);
                timeoutFront.position.set(app.renderer.width/2 - timeoutFront.width/2 + 12, 5);
                //timeoutFront x범위 0 ~ 446
                let timeoutMask = new PIXI.Graphics();
                timeoutMask.beginFill(0x888888);
                timeoutMask.drawRoundedRect(app.renderer.width/2 - timeoutBackground.width/2, 5, timeoutBorder.width, timeoutBorder.height, 40);
                timeoutMask.endFill();
                let timeoutContainer = new PIXI.Container();
                timeoutContainer.mask = timeoutMask;
                timeoutContainer.addChild(timeoutFront);
                gameScreen.addChild(timeoutBorder);
                gameScreen.addChild(timeoutBackground);
                gameScreen.addChild(timeoutContainer);
            }
            const createDoorSheet = () => {
                let doorSprite = new PIXI.BaseTexture.from(app.loader.resources['door_image'].url);
                const width = 144;
                const height = 96;
                const tileW = 98;
                const tileH = 95;

                playerSheet["open"] = [
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 3 * height + 1, tileW, tileH)),
                ]
                playerSheet["closed"] = [
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 0 * height + 1, tileW, tileH)),
                ]
                playerSheet["closing"] = [
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 3 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 3 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 3 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 2 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 2 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 2 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 1 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 1 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 1 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 0 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 0 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 0 * height + 1, tileW, tileH)),
                ]
                playerSheet["opening"] = [
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 0 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 0 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 0 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 1 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 1 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 1 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 2 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 2 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 2 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(0 * width + 23, 3 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(1 * width + 23, 3 * height + 1, tileW, tileH)),
                    new PIXI.Texture(doorSprite, new PIXI.Rectangle(2 * width + 23, 3 * height + 1, tileW, tileH)),
                ]
            }

            const createShootSheet = () => {
                let width = 258;
                let shootEffect = new PIXI.BaseTexture.from(app.loader.resources['shoot1'].url);
                playerSheet["shoot1"] = [
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(0 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(1 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(2 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(3 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(4 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(5 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(6 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(7 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(8 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(9 * width, 0, 258, 258)),
                    new PIXI.Texture(shootEffect, new PIXI.Rectangle(10 * width, 0, 258, 258)),
                ];
            }
            const createPlayerSheet = (select) => {
                let selected = new PIXI.BaseTexture.from(app.loader.resources[select + '_sprite'].url);
                let selectedEffect = new PIXI.BaseTexture.from(app.loader.resources[select + '_effect'].url);
                const width = 32;
                const height = 34;
                
                playerSheet[select + "_dance"] = [
                    new PIXI.Texture(selected, new PIXI.Rectangle(0 * width + 5, 0 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(1 * width + 5, 0 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(2 * width + 5, 0 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(3 * width + 5, 0 * height + 4, 21, 29)),
                ]

                playerSheet[select + "_hurt"] = [
                    new PIXI.Texture(selected, new PIXI.Rectangle(0 * width + 5, 1 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(1 * width + 5, 1 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(2 * width + 5, 1 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(3 * width + 5, 1 * height + 4, 21, 29)),
                ]

                playerSheet[select + "_idle"] = [
                    new PIXI.Texture(selected, new PIXI.Rectangle(0 * width + 5, 2 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(1 * width + 5, 2 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(2 * width + 5, 2 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(3 * width + 5, 2 * height + 4, 21, 29)),
                ]

                playerSheet[select + "_jump"] = [
                    new PIXI.Texture(selected, new PIXI.Rectangle(0 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(1 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(2 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(3 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(4 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(5 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(6 * width + 5, 3 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(7 * width + 5, 3 * height + 4, 21, 29)),
                ]

                playerSheet[select + "_push"] = [
                    new PIXI.Texture(selected, new PIXI.Rectangle(0 * width + 5, 4 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(1 * width + 5, 4 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(2 * width + 5, 4 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(3 * width + 5, 4 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(4 * width + 5, 4 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(5 * width + 5, 4 * height + 4, 21, 29)),
                ]

                playerSheet[select + "_run"] = [
                    new PIXI.Texture(selected, new PIXI.Rectangle(0 * width + 5, 5 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(1 * width + 5, 5 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(2 * width + 5, 5 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(3 * width + 5, 5 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(4 * width + 5, 5 * height + 4, 21, 29)),
                    new PIXI.Texture(selected, new PIXI.Rectangle(5 * width + 5, 5 * height + 4, 21, 29)),
                ]

                playerSheet[select + "_die"] = [
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(0 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(1 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(2 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(3 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(4 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(5 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(6 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(7 * width, 1 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(6 * width, 0 * height, 32, 33)),
                ]

                playerSheet[select + "_effect1"] = [
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(0 * width, 0 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(1 * width, 0 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(2 * width, 0 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(3 * width, 0 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(4 * width, 0 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(5 * width, 0 * height, 32, 33)),
                ]

                playerSheet[select + "_effect2"] = [
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(0 * width, 2 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(1 * width, 2 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(2 * width, 2 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(3 * width, 2 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(4 * width, 2 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(5 * width, 2 * height, 32, 33)),
                    new PIXI.Texture(selectedEffect, new PIXI.Rectangle(6 * width, 2 * height, 32, 33)),
                ]

            }
            
            const createDoor = (x, y) => {
                rect = new PIXI.Graphics();
                rect.lineStyle(2, 0x49FF33, 1);
                rect.drawRect(450 + x * 98, 80 + y * 95, 98, 95);
                gameScreen.removeChild(rect);
                door[x + 7 * y] = new PIXI.AnimatedSprite(playerSheet.closed);
                door[x + 7 * y].open = false;
                door[x + 7 * y].interactive = true;
                door[x + 7 * y].buttonMode = true;
                
                door[x + 7 * y].animationSpeed = 0.3;
                door[x + 7 * y].loop = true;
                door[x + 7 * y].x = 450 + x * 98;
                door[x + 7 * y].y = 80 + y * 95;
                gameScreen.addChild(door[x + 7 * y]);
                door[x + 7 * y].on("pointerover", pointerOver);
                door[x + 7 * y].on("pointerout", pointerOut);
                door[x + 7 * y].on("pointerup", pointerUp);
                door[x + 7 * y].on("pointerdown", pointerDown);
                door[x + 7 * y].on("pointerupoutside", pointerUpOutside);

                function pointerOver() {
                    if (!pointerIsOver) {
                        pointerIsDown = true;
                    }
                    if (myTurn) {
                        if (myHide) {
                            playerPick.x = 488 + x * 98;
                            playerPick.y = 140 + y * 95;
                            playerPick.alpha = 0.5;
                            gameScreen.addChild(playerPick);
                        }
                        rect.drawRect(450 + x * 98, 80 + y * 95, 98, 95);
                        door[x + 7 * y].scale.x = 1.02;
                        door[x + 7 * y].scale.y = 1.02;
                    }
                }

                function pointerOut() {
                    if (!pointerIsDown) {
                        pointerIsOver = false;
                    }
                    if (myTurn) {
                        if (myHide) {
                            gameScreen.removeChild(playerPick);
                        }
                        gameScreen.removeChild(rect);
                        door[x + 7 * y].scale.x = 1;
                        door[x + 7 * y].scale.y = 1;
                    }
                }

                function pointerUp() {
                    console.log(firstTurn + " " + position + " " + myTurn + " " + myHide + " " + myOpen + " " + myX + " " + myY + " " + x + " " + y);
                    if (!pointerIsOver) {
                        if (myTurn) {
                            if (myOpen) {
                                server.emit("opening", {
                                    firstTurn: firstTurn,
                                    pos: position,
                                    x: x,
                                    y: y,
                                })
                            myOpen= false;
                            myTurn = false;
                            gameScreen.removeChild(playerPick);
                            } else {
                                if (firstTurn) {
                                    myX = x;
                                    myY = y;
                                    server.emit("hide", {
                                        pos: position,
                                        x: x,
                                        y: y,
                                    });
                                    server.emit("opening", {
                                        firstTurn: firstTurn,
                                        pos: position,
                                        x: x,
                                        y: y,
                                    });
                                    firstTurn = false;
                                    gameScreen.removeChild(playerPick);
                                } else {
                                    if (myHide) {
                                        if (myX != undefined && myY != undefined) {
                                            if (cast || (myX - 2 < x  && x < myX + 2 && myY - 2 < y && y < myY + 2)) {
                                                if (!(x < 0 || x > 6 || y < 0 || y > 6)) {
                                                    myX = x;
                                                    myY = y;
                                                    server.emit("hide", {
                                                        pos: position,
                                                        x: x,
                                                        y: y,
                                                    })
                                                    cast = false;
                                                    myOpen =true;
                                                    gameScreen.removeChild(playerPick);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                function pointerDown() {
                    pointerIsDown = true;
                }

                function pointerUpOutside() {
                    pointerIsOver = false;
                    pointerIsDown = false;
                }
            }

            const createPlayer = () => {
                if (!position) {
                    player = new PIXI.AnimatedSprite(playerSheet.pink_idle);
                    playerPick = new PIXI.AnimatedSprite(playerSheet.pink_idle);
                } else {
                    if (position) {
                        player = new PIXI.AnimatedSprite(playerSheet.blue_idle);
                        playerPick = new PIXI.AnimatedSprite(playerSheet.blue_idle);
                    }
                }
                player.animationSpeed = 0.15;
                player.loop = true;
                player.alpha = 0.5;
                player.x = 488 + 1 * 98;
                player.y = 140 + 1 * 95;
                player.play();
            }

            const createEnemy = () => {
                if (position) {
                    enemy = new PIXI.AnimatedSprite(playerSheet.pink_idle);
                } else {
                    if (!position) {
                        enemy = new PIXI.AnimatedSprite(playerSheet.blue_idle);
                    }
                }
                enemy.animationSpeed = 0.15;
                enemy.loop = true;
                enemy.play();
            }

            const createShoot = () => {
                shoot = new PIXI.AnimatedSprite(playerSheet.shoot1);
                shoot.scale.set(0.5);
                shoot.pivot.set(shoot.width/2, shoot.height/2);
                shoot.animationSpeed = 0.2;
                shoot.loop = false;
            }
            const createArrow = () => {
                const arrowTexture = new PIXI.BaseTexture.from(app.loader.resources['arrow'].url);
                playerArrow = new PIXI.Sprite(new PIXI.Texture(arrowTexture, new PIXI.Rectangle(204, 0, 205, 204)));
                playerArrow.scale.x = 0.15;
                playerArrow.scale.y = 0.15;
                playerArrow.x = 485 + 1 * 98;
                playerArrow.y = 100 + 1 * 95;
                enemyArrow = new PIXI.Sprite(new PIXI.Texture(arrowTexture, new PIXI.Rectangle(611, 0, 205, 204)));
                enemyArrow.scale.x = 0.15;
                enemyArrow.scale.y = 0.15;
            }

            function win(data) {
                let connections = data.connections;
                if (!position) {
                    gameScreen.removeChild(enemy);
                    setTimeout(() => {
                        console.log(gameScreen.children);
                        enemy.x = 488 + data.x * 98;
                        enemy.y = 140 + data.y * 95;
                        enemy.textures = playerSheet.blue_die;
                        enemy.loop = false;
                        player.textures = playerSheet.pink_dance;
                        gameScreen.addChild(enemy);
                        gameScreen.removeChild(playerPick);
                        enemy.play();
                        player.play();
                    }, 200);
                } else {
                    if (position) {
                        gameScreen.removeChild(enemy);
                        setTimeout(() => {
                            enemy.x = 488 + data.x * 98;
                            enemy.y = 140 + data.y * 95;  
                            enemy.textures = playerSheet.pink_die;
                            enemy.loop = false;
                            player.textures = playerSheet.blue_dance;
                            gameScreen.addChild(enemy);
                            gameScreen.removeChild(playerPick);
                            enemy.play();
                            player.play();
                        }, 200);
                    }
                }
                let winTexture = PIXI.Texture.from(win_image);
                result = new PIXI.Sprite(winTexture);
                result.position.set(app.renderer.width/2, app.renderer.height/2);
                result.pivot.set(result.width/2, result.height/2);
                result.scale.set(0.6);
                result.texture = winTexture;
                setTimeout(() => {
                    gameScreen.removeChild(enemy);
                    gameScreen.removeChild(player);
                    gameScreen.addChild(result);
                    setTimeout(() => {
                        for (let i = 0; i < gameScreen.children.length; i++) {
                            gameScreen.removeChild(gameScreen.children[i]);
                        };
                        createUI();
                        app.loader.load(setup);
                        connectionReady1.texture = connectionWaitTexutre;
                        connectionReady2.texture = connectionWaitTexutre;
                        if (!connections[0]) {
                            gameScreen.removeChild(userInfo1);
                            gameScreen.removeChild(userInfoRect1);    
                        }
                        if (!connections[1]) {
                            gameScreen.removeChild(userInfo2);
                            gameScreen.removeChild(userInfoRect2);
                        }
                        if (connections[0] && position) {
                            userInfo1.removeChild(ready1);
                            userInfo1.removeChild(skillText1);
                            userInfo1.removeChild(skillButton1);
                        }
                        if (connections[1] && !position) {
                            userInfo2.removeChild(ready2);
                            userInfo2.removeChild(skillText2);
                            userInfo2.removeChild(skillButton2);
                        }
                    }, 5000);
                }, 5000)
                
            }

            function lose(connections) {
                setTimeout(() => {
                    if (!position) {
                        setTimeout(() => {
                            player.textures = playerSheet.pink_die;
                            player.loop = false;
                            enemy.textures = playerSheet.blue_dance;
                            gameScreen.removeChild(playerPick);
                            enemy.play();
                            player.play();
                        }, 200);
                    } else {
                        if (position) {
                            setTimeout(() => {
                                player.textures = playerSheet.blue_die;
                                player.loop = false;
                                enemy.textures = playerSheet.pink_dance;
                                gameScreen.removeChild(playerPick);
                                enemy.play();
                                player.play();
                            }, 200);
                        }
                    }
                }, 1000);
                let loseTexture = PIXI.Texture.from(lose_image);
                result = new PIXI.Sprite(loseTexture);
                result.position.set(app.renderer.width/2, app.renderer.height/2);
                result.pivot.set(result.width/2, result.height/2);
                result.scale.set(0.6);
                result.texture = loseTexture;
                setTimeout(() => {
                    gameScreen.removeChild(enemy);
                    gameScreen.removeChild(player);
                    gameScreen.addChild(result);
                    setTimeout(() => {
                        for (let i = 0; i < gameScreen.children.length; i++) {
                            gameScreen.removeChild(gameScreen.children[i]);
                        };
                        createUI();
                        app.loader.load(setup);
                        connectionReady1.texture = connectionWaitTexutre;
                        connectionReady2.texture = connectionWaitTexutre;
                        if (!connections[0]) {
                            gameScreen.removeChild(userInfo1);
                            gameScreen.removeChild(userInfoRect1);    
                        }
                        if (!connections[1]) {
                            gameScreen.removeChild(userInfo2);
                            gameScreen.removeChild(userInfoRect2);
                        }
                        if (connections[0] && position) {
                            userInfo1.removeChild(ready1);
                            userInfo1.removeChild(skillText1);
                            userInfo1.removeChild(skillButton1);
                        }
                        if (connections[1] && !position) {
                            userInfo2.removeChild(ready2);
                            userInfo2.removeChild(skillText2);
                            userInfo2.removeChild(skillButton2);
                        }
                    }, 5000);
                }, 5000)
                
            }
            return () => {
                window.removeEventListener("keyup", keyHandler);
                window.removeEventListener("click", keyHandler);
                window.removeEventListener("wheel", keyHandler);
            }   
        });
    }, [])
    
    return (
        <>
            <div>.</div>
            {/* {visible && <input type='text' style={{position:"absolute", width:"350px", height: "30px", left:"620px", top:"400px"}} value={roomNameText} onChange={handleChange} onKeyUp={
                (event) => {
                    if (event.key == "Enter") {
                        setVisible(false);
                        roomNamePostRequest();
                    }
                }
            }></input>} */}
        </>
    )
}

export default Scripts;