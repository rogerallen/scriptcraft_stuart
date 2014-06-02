// ======================================================================
//
// BowAndArrowFight mini-game (derived from snowball fight)
//
//   /js new BowAndArrowFight(60).start();
//
// ======================================================================
var bkGameMode = org.bukkit.GameMode,
bkEntityDamageByEntityEvent = org.bukkit.event.entity.EntityDamageByEntityEvent,
bkBlockDamageEvent = org.bukkit.event.block.BlockDamageEvent,
bkItemStack = org.bukkit.inventory.ItemStack,
bkMaterial = org.bukkit.Material,
bkArrow = org.bukkit.entity.Arrow;

var _startGame = function( gameState ) {
    var i,
    teamName,
    team,
    player;

    // don't let game start if already in progress (wait for game to finish)
    if ( gameState.inProgress ) {
        return;
    }
    gameState.inProgress = true;
    // reset timer
    gameState.duration = gameState.originalDuration;
    // put all players in survival mode and give them each enough ammo
    for ( i = 10; i < gameState.duration; i += 10 ) {
        gameState.ammo.push( gameState.ammo[ 0 ] );
    }
    for ( teamName in gameState.teams ) {
        gameState.teamScores[teamName] = 0;
        team = gameState.teams[ teamName ];
        for ( i = 0; i < team.length; i++ ) {
            player = server.getPlayer( team[i] );
            gameState.savedModes[ player.name ] = player.gameMode;
            player.gameMode = bkGameMode.SURVIVAL;
            player.inventory.addItem( gameState.ammo );
            player.inventory.addItem( gameState.bow );
        }
    }
};
// ======================================================================
// end the game
// ======================================================================
var _endGame = function( gameState ) {
    var scores = [],
    leaderBoard = [],
    tn,
    i,
    teamName,
    team,
    player,
    handlerList;

    leaderBoard  = [];
    for ( tn in gameState.teamScores){
        leaderBoard.push([tn,gameState.teamScores[tn]]);
    }
    leaderBoard.sort(function(a,b){ return b[1] - a[1];});

    for ( i = 0; i < leaderBoard.length; i++ ) {
        scores.push( 'Team ' + leaderBoard[i][0] + ' scored ' + leaderBoard[i][1] );
    }

    for ( teamName in gameState.teams ) {
        team = gameState.teams[teamName];
        for ( i = 0; i < team.length; i++ ) {
            // restore player's previous game mode and take back bow & arrows
            player = server.getPlayer( team[i] );
            player.gameMode = gameState.savedModes[ player.name ];
            player.inventory.removeItem( gameState.ammo );
            player.inventory.removeItem( gameState.bow );
            player.sendMessage( 'GAME OVER.' );
            player.sendMessage( scores );
        }
    }
    gameState.listener.unregister();
    gameState.listener2.unregister();
    gameState.inProgress = false;
};

// ======================================================================
// get the team the player belongs to
// ======================================================================
var _getTeam = function( player, pteams ) {
    var teamName,
    team,
    i;
    for ( teamName in pteams ) {
        team = pteams[ teamName ];
        for ( i = 0; i < team.length; i++ ) {
            if ( team[i] == player.name ) {
                return teamName;
            }
        }
    }
    return null;
};

// ======================================================================
// construct a new game & return map with a start function
// ======================================================================
var createGame = function( duration, teams ) {
    var players,
    i,
    _snowBalls = new bkItemStack( bkMaterial.ARROW, 64 ),
    _bow = new bkItemStack( bkMaterial.BOW, 1);

    var _gameState = {
        teams: teams,
        duration: duration,
        originalDuration: duration,
        inProgress: false,
        teamScores: {},
        listener: null,
        listener2: null,
        savedModes: {},
        ammo: [ _snowBalls ],
        bow: [ _bow ]
    };
    if ( typeof duration == 'undefined' ) {
        duration = 60;
    }
    if ( typeof teams == 'undefined' ) {
        teams =  [];
        players = server.onlinePlayers;
        for ( i = 0; i < players.length; i++ ) {
            teams.push( players[i].name );
        }
    }
    //
    // allow for teams param to be either
    // {red:['player1','player2'],blue:['player3']} or
    // ['player1','player2','player3'] if all players are against each
    // other (no teams)
    //
    if ( teams instanceof Array ) {
        _gameState.teams = {};
        for ( i = 0;i < teams.length; i++ ) {
            _gameState.teams[ teams[i] ] = [ teams[i] ];
        }
    }
    /*
      this function is called every time a player is damaged by
      another entity/player
    */
    var _onDamage = function( event ) {
        var arrow = event.damager;
        if ( !arrow || !( arrow instanceof bkArrow ) ) {
            return;
        }
        var throwersTeam = _getTeam( arrow.shooter, _gameState.teams );
        var damageeTeam = _getTeam( event.entity, _gameState.teams);
        if ( !throwersTeam || !damageeTeam ) {
            return; // thrower/damagee wasn't in game
        }
        if ( throwersTeam != damageeTeam ) {
            _gameState.teamScores[ throwersTeam ]++;
        } else {
            _gameState.teamScores[ throwersTeam ]--;
        }
    };
    // this isn't quite working yet.  FIXME
    // want this to eventually score points when arrow hits wood
    var _onBlockDamage = function( event ) {
        var arrow = event.damager;
        if ( !arrow || !( arrow instanceof bkArrow ) ) {
            return;
        }
        var throwersTeam = _getTeam( arrow.shooter, _gameState.teams );
        _gameState.teamScores[ throwersTeam ]++;
    };

    return {
        start: function( ) {
            _startGame( _gameState );
            _gameState.listener = events.on(bkEntityDamageByEntityEvent,
                                            _onDamage);
            _gameState.listener2 = events.on(bkBlockDamageEvent,
                                            _onBlockDamage);

            new java.lang.Thread( function( ) {
                while ( _gameState.duration-- ) {
                    java.lang.Thread.sleep( 1000 ); // sleep 1,000 millisecs (1 second)
	        }
                _endGame(_gameState);
            } ).start( );
        }
    };
};
exports.BowAndArrowFight = createGame;

// ======================================================================
// construct a new game arena
// ======================================================================
exports.createGameArena = function() {
    var tmp = this;
    var arenaRadius = 20;
    var arenaHeight = 10;
    var skirt = 3;
    var goalProbability = 0.25;
    // cylinder draws from the corner, not from the center.
    tmp.back(skirt).left(skirt).
        box(blocks.air,2*arenaRadius+2*skirt,arenaHeight+skirt,2*arenaRadius+2*skirt);
    tmp.down(1)
        .box(blocks.iron,2*arenaRadius,1,2*arenaRadius)
        .up(arenaHeight+1)
        .box(blocks.glass,2*arenaRadius,1,2*arenaRadius)
        .down(arenaHeight)
        .cylinder0(blocks.iron,arenaRadius,arenaHeight)
        .right(arenaRadius-1)
        .box(blocks.air,2,3,1)
        .fwd(2*arenaRadius)
        .box(blocks.air,2,3,1);
    // center obstacles
    tmp = this;
    tmp = tmp.fwd(arenaRadius/2).right(arenaRadius/2);
    for(var i = 0; i < arenaRadius; i += 3) {
        tmp.chkpt('chk1');
        for(var j = 0; j < arenaRadius; j += 3) {
            tmp = tmp.box(blocks.iron,1,10,1)
                .fwd(3);
        }
        tmp = tmp.move('chk1').right(3);
    }
    // center chunks of wood as goals
    tmp = this;
    tmp = tmp.fwd(arenaRadius/2).right(arenaRadius/2);
    for(var i = 0; i < arenaRadius; i += 3) {
        tmp.chkpt('chk1');
        for(var j = 0; j < arenaRadius; j += 3) {
            if(Math.random() < goalProbability) {
                var h = Math.floor(Math.random() * (arenaHeight/2 - 1)) +
                    arenaHeight/2;
                tmp = tmp.up(h)
                    .box(blocks.wood,1,1,1)
                    .down(h)
                    .fwd(3);
            } else {
                tmp = tmp.fwd(3);
            }
        }
        tmp = tmp.move('chk1').right(3);
    }

};
