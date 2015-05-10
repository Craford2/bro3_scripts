// ==UserScript==
// @name         bro3_auto_builder2
// @namespace    bro3_auto_builder2
// @include      http://*.3gokushi.jp/user/*
// @include      http://*.3gokushi.jp/village.php*
// @description  ブラウザ三国志オートビルダー by Craford
// @version      0.01

// @grant   GM_addStyle
// @grant   GM_deleteValue
// @grant   GM_getValue
// @grant   GM_listValues
// @grant   GM_log
// @grant   GM_setValue
// @grant   GM_xmlhttpRequest
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js

// ==/UserScript==
// version date       author
// 0.01    2014/12/27 jquery1.11.1ベースで作成開始(1.11.2はeach文の挙動がおかしいので見送り)

// load jQuery
jQuery.noConflict();
j$ = jQuery;

// GreaseMonkeyラッパー関数の定義
initGMWrapper();

//----------//
// 変数定義 //
//----------//
// ソフトウェアバージョン
var VERSION = "0.01";

// 拠点データ取り扱い用変数
var g_villageMap = [];
var g_buildList = [];
var g_buildMode;
var g_lastBuild;  // シミュレーター用

// 特殊定数
var HOST = location.hostname;        // アクセスURLホスト
var SERVICE = '';              // サービス判定が必要な場合に使用する予約定数
var SVNAME = HOST.substr(0,location.hostname.indexOf(".")) + SERVICE;
var GM_KEY = "AB21_" + HOST.substr(0,HOST.indexOf("."));

//--------------------//
// ビルダー処理用定数 //
//--------------------//
var TYPE_LEVELUP = 'levelup';
var TYPE_BUILD = 'build';

var STATUS_DELETE   = '削除中';
var STATUS_NOWBUILD = '建設中';
var STATUS_PROMISE  = '建設準備中';

//--------------------//
// 設定アクセス用定数 //
//--------------------//
// タイプ判定
var TYPE_CHECKBOX = 'c';
var TYPE_INPUT = 't';
var TYPE_BLANK = 'b';
var TYPE_LABEL = 'l';

// 建設設定[基本](チェックボックス)
var CL_BASE      = 'cl01';     // 拠点
var CL_PARADE    = 'cl02';     // 練兵所
var CL_TRAINING  = 'cl03';     // 訓練所
var CL_MARKET    = 'cl04';     // 市場
var CL_WOOD      = 'cl05';     // 伐採所
var CL_LODGE     = 'cl06';     // 宿舎
var CL_EXPEDITE  = 'cl07';     // 遠征訓練所
var CL_LABO      = 'cl08';     // 研究所
var CL_STONE     = 'cl09';     // 石切り場
var CL_L_LODGE   = 'cl10';     // 大宿舎
var CL_W_TOWER   = 'cl11';     // 見張り台
var CL_SYMBOL    = 'cl12';     // 銅雀台
var CL_IRON      = 'cl13';     // 製鉄所
var CL_BALLACK   = 'cl13';     // 兵舎
var CL_W_SMITHY  = 'cl14';     // 鍛冶場
var CL_W_WHEEL   = 'cl15';     // 水車
var CL_FOOD      = 'cl16';     // 畑
var CL_B_BALLACK = 'cl17';     // 弓兵舎
var CL_A_SMITHY  = 'cl18';     // 防具工場
var CL_FACTORY   = 'cl20';     // 工場
var CL_STORAGE   = 'cl21';     // 倉庫
var CL_STABLE    = 'cl22';     // 厩舎
var CL_WEAPON    = 'cl23';     // 兵器工房
var CL_OFF       = 'cloff';    // 設定無効

// 建設設定[基本](数値入力)
var TL_BASE      = 'tl01';     // 拠点
var TL_PARADE    = 'tl02';     // 練兵所
var TL_TRAINING  = 'tl03';     // 訓練所
var TL_MARKET    = 'tl04';     // 市場
var TL_WOOD      = 'tl05';     // 伐採所
var TL_LODGE     = 'tl06';     // 宿舎
var TL_EXPEDITE  = 'tl07';     // 遠征訓練所
var TL_LABO      = 'tl08';     // 研究所
var TL_STONE     = 'tl09';     // 石切り場
var TL_L_LODGE   = 'tl10';     // 大宿舎
var TL_W_TOWER   = 'tl11';     // 見張り台
var TL_SYMBOL    = 'tl12';     // 銅雀台
var TL_IRON      = 'tl13';     // 製鉄所
var TL_BALLACK   = 'tl13';     // 兵舎
var TL_W_SMITHY  = 'tl14';     // 鍛冶場
var TL_W_WHEEL   = 'tl15';     // 水車
var TL_FOOD      = 'tl16';     // 畑
var TL_B_BALLACK = 'tl17';     // 弓兵舎
var TL_A_SMITHY  = 'tl18';     // 防具工場
var TL_FACTORY   = 'tl20';     // 工場
var TL_STORAGE   = 'tl21';     // 倉庫
var TL_STABLE    = 'tl22';     // 厩舎
var TL_WEAPON    = 'tl23';     // 兵器工房

// 建設設定[拡張](チェックボックス)
var CO_FOOD_BASE    = 'co01';  // 糧村化
var CO_STORAGE_BASE = 'co02';  // 倉庫村化
var CO_HAS_EMPTY    = 'co03';  // 空き地を残す
var CO_FOOD         = 'co04';  // 畑
var CO_WOOD         = 'co05';  // 伐採所
var CO_STONE        = 'co06';  // 石切り場
var CO_IRON         = 'co07';  // 製鉄所
var CO_STORAGE      = 'co08';  // 倉庫
var CO_LODGE        = 'co09';  // 宿舎
var CO_L_LODGE      = 'co10';  // 大宿舎
var CO_PARADE       = 'co11';  // 練兵所
var CO_SYMBOL       = 'co12';  // 銅雀台
var CO_LABO         = 'co13';  // 研究所
var CO_W_TOWER      = 'co14';  // 見張り台
var CO_BALLACK      = 'co15';  // 兵舎
var CO_B_BALLACK    = 'co16';  // 弓兵舎
var CO_STABLE       = 'co17';  // 厩舎
var CO_WEAPON       = 'co18';  // 兵器工房
var CO_W_SMITHY     = 'co19';  // 鍛冶場
var CO_A_SMITHY     = 'co20';  // 防具工場
var CO_TRAINING     = 'co21';  // 訓練所
var CO_EXPEDITE     = 'co22';  // 遠征訓練所
var CO_MARKET       = 'co23';  // 市場
var CO_FACTORY      = 'co24';  // 工場
var CO_W_WHEEL      = 'co25';  // 水車
var CO_OFF          = 'cooff'; // 設定無効

// 建設設定[拡張](数値入力)
var TO_HAS_EMPTY    = 'to03';  // 空き地を残す
var TO_FOOD         = 'to04';  // 畑
var TO_WOOD         = 'to05';  // 伐採所
var TO_STONE        = 'to06';  // 石切り場
var TO_IRON         = 'to07';  // 製鉄所
var TO_STORAGE      = 'to08';  // 倉庫
var TO_LODGE        = 'to09';  // 宿舎
var TO_L_LODGE      = 'to10';  // 大宿舎

// 建設設定(カスタム)
var CC_OFF          = 'ccoff'; // 設定無効

// 内政設定
var CA_SKILL_F1     = 'ca01';  // 食糧知識
var CA_SKILL_W1     = 'ca02';  // 伐採知識
var CA_SKILL_S1     = 'ca03';  // 石切知識
var CA_SKILL_I1     = 'ca04';  // 製鉄知識
var CA_SKILL_F2     = 'ca05';  // 食糧技術
var CA_SKILL_W2     = 'ca06';  // 伐採技術
var CA_SKILL_S2     = 'ca07';  // 石切技術
var CA_SKILL_I2     = 'ca08';  // 製鉄技術
var CA_SKILL_R1     = 'ca09';  // 豊潤祈祷
var CA_SKILL_F3     = 'ca10';  // 食糧革命
var CA_SKILL_W1     = 'ca21';  // 農林知識
var CA_SKILL_W2     = 'ca22';  // 加工知識
var CA_SKILL_W3     = 'ca23';  // 農林技術
var CA_SKILL_W4     = 'ca24';  // 加工技術
var CA_SKILL_T1     = 'ca41';  // 素材知識
var CA_SKILL_T2     = 'ca42';  // 恵風
var CA_SKILL_T3     = 'ca43';  // 富国
var CA_SKILL_T4     = 'ca44';  // 富国論
var CA_SKILL_T5     = 'ca45';  // 才女の音律
var CA_SKILL_T6     = 'ca46';  // 聡明叡智
var CA_SKILL_T7     = 'ca47';  // 優姫の敬愛
var CA_SKILL_T8     = 'ca48';  // 孫家の恵み
var CA_SKILL_T9     = 'ca49';  // 美玉華舞
var CA_SKILL_TA     = 'ca4a';  // 苛政虎舞
var CA_SKILL_Q1     = 'ca61';  // 豊穣
var CA_SKILL_Q2     = 'ca62';  // 人選眼力
var CA_SKILL_Q3     = 'ca63';  // 富国強兵
var CA_SKILL_C1     = 'ca81';  // 呉の治世
var CA_SKILL_C2     = 'ca82';  // 王佐の才
var CA_SKILL_C3     = 'ca83';  // 賢妃施政
var CA_SKILL_C4     = 'ca84';  // 麗妃都政
var CA_SKILL_C5     = 'ca85';  // 陳留王政
var CA_SKILL_C6     = 'ca86';  // 徳義為政
var CA_OFF          = 'caoff'; // 設定無効
var CA_AVAILABLE    = 'caavl'; // 有効施設存在時のみ発動

// 保存対象の設定項目
var g_saveBuilderOptionList1 = [
  // 建設設定[基本](数値入力)
  TL_BASE, TL_PARADE, TL_TRAINING, TL_MARKET, TL_WOOD, TL_LODGE,
  TL_EXPEDITE, TL_LABO, TL_STONE, TL_L_LODGE, TL_W_TOWER, TL_SYMBOL,
  TL_IRON, TL_BALLACK, TL_W_SMITHY, TL_W_WHEEL, TL_FOOD, TL_B_BALLACK,
  TL_A_SMITHY, TL_FACTORY, TL_STORAGE, TL_STABLE, TL_WEAPON,
];
var g_saveBuilderOptionList2 = [
  // 建設設定[拡張](チェックボックス)
  CO_FOOD_BASE, CO_STORAGE_BASE, CO_HAS_EMPTY, CO_FOOD, CO_WOOD,
  CO_STONE, CO_IRON, CO_STORAGE, CO_LODGE, CO_L_LODGE, CO_PARADE,
  CO_SYMBOL, CO_LABO, CO_W_TOWER, CO_BALLACK, CO_B_BALLACK,
  CO_STABLE, CO_WEAPON, CO_W_SMITHY, CO_A_SMITHY, CO_TRAINING,
  CO_EXPEDITE, CO_MARKET, CO_FACTORY, CO_W_WHEEL, CO_OFF,

  // 建設設定[拡張](数値入力)
  TO_HAS_EMPTY, TO_FOOD, TO_WOOD, TO_STONE, TO_IRON, TO_STORAGE,
  TO_LODGE, TO_L_LODGE,
];
var g_saveBuilderOptionList3 = [
  // 建設設定[カスタム](チェックボックス)
  CC_OFF,
];
var g_saveBuilderOptionList4 = [
  // 内政設定
  CA_SKILL_F1, CA_SKILL_W1, CA_SKILL_S1, CA_SKILL_I1,
  CA_SKILL_F2, CA_SKILL_W2, CA_SKILL_S2, CA_SKILL_I2, CA_SKILL_R1, CA_SKILL_F3, CA_SKILL_W1, CA_SKILL_W2, CA_SKILL_W3, CA_SKILL_W4,
  CA_SKILL_T1, CA_SKILL_T2, CA_SKILL_T3, CA_SKILL_T4, CA_SKILL_T5, CA_SKILL_T6, CA_SKILL_T7, CA_SKILL_T8, CA_SKILL_T9, CA_SKILL_TA,
  CA_SKILL_Q1, CA_SKILL_Q2, CA_SKILL_Q3,
  CA_SKILL_C1, CA_SKILL_C2, CA_SKILL_C3, CA_SKILL_C4, CA_SKILL_C5, CA_SKILL_C6,
  CA_OFF, CA_AVAILABLE
];

//----------------//
// メインルーチン //
//----------------//
(function() {
  // 実行判定
  if (isExecute() == false) {
    return;
  }

  // 君主プロフィール
  if (location.pathname == "/user/" || location.pathname == "/user/index.php") {
    saveUserProfile();
  }

  // 都市画面
  if (location.pathname == "/village.php") {
    // セッションIDの取得
    SSID = getSessionId();
    if( SSID == "" ){
      alert("ページの仕様が変更されたため情報が取れませんでした。");
      return;
    }

    // ビルダー設定ボタンを描画
    drawBuilderSettingButton();

    // 画面描画
    createSettingWindow();
/*

    // オートビルダー処理
    autobuilder();
*/
  }
})();

//------------------------//
// プロフィール情報を保存 //
//------------------------//
function saveUserProfile(targetObject){
  // 検索ターゲットの決定
  var target = null;
  if (typeof targetObject != 'undefined') {
    target = targetObject;
  }

  // プレイヤープロフィール判定
  if (j$("#statMenu", target).length == 0) {
    // 他人のプロフィール画面の場合は何もしない
    return;
  }

  // 拠点一覧の取得
  var VillageList = [];
  j$("table[class=commonTables] tr:has(a[href*='village_change.php'])", target).slice(0,10).each(
    // 拠点情報を持つ行のみ処理対象
    function() {
      var vId = null, vName = null, vPosX = null, vPosY = null;
      // beyond並走時にいらないセルを拾うため、ブラ三運営の作成セルのみを対象
      j$("td:not([id*=beyond])", this).each(
        function(index) {
          if (index == 0) {
            // 拠点ID
            j$("a", this).attr("href").match(/village_id=(\d+)/);
            vId = RegExp.$1;
            vName = j$("a", this).text();
          } else if (index == 1) {
            // 座標
            j$(this).text().match(/([-]*\d+),([-]*\d+)/);
            vPosX = RegExp.$1;
            vPosY = RegExp.$2;
          } else if (index == 2) {
            // 人口エリアに記述がある場合のみ拠点情報をpush
            if (j$(this).text().trim() != "" && vId != null && vPosX != null && vPosY != null) {
              VillageList.push(new VillageObject(vId, vName, vPosX, vPosY));
            }
          }
        }
      );
    }
  );

  if (VillageList.length == 0) {
    alert("プロフィールページの仕様が変更されたため情報が取れませんでした。");
    return;
  }

  // 拠点情報の保存
  saveVillageList(VillageList);
}

//----------------------------------//
// ビルダー設定画面起動ボタンを描画 //
//----------------------------------//
function drawBuilderSettingButton() {
  j$("div[id=sidebar] div[class=sideBox]").eq(1).before(
    "<a href='#' id=autoBuilderButton style='color:cyan; text-decoration: underline;'>AutoBuilder</a>" +
    "<input type=button value='一時停止' style='font-size:10px; position:relative; top:-4px; float:right;'>"
  );
  j$("#autoBuilderButton").bind("click", 
    function(){
      var villageList = loadVillageList();
      if (villageList.length == 0) {
/*
        j$("#CBVTable").append(
          "<tr><td style='font-size:12px;'>" + 
          "ツールのご利用ありがとうございます。<br>" +
          "プロフィールページにアクセスして<br>" +
          "拠点情報の読み込みを行ってください。" +
          "</td></tr>"
        );
*/
      } else {
        j$("#villageWindow").css("display", "block");
//        j$("#settingWindow").css("display", "block");
      }
    }
  );
}

//--------------//
// 設定画面作成 //
//--------------//
function createSettingWindow() {
  // css定義を追加
  addBuilderCss();

  // 画面描画(拠点リスト)
  drawVillageWindow();

  // 画面描画(設定画面)
  drawSettingWindow();

  // 画面描画(建設シミュレーター)
  drawSimulatorWindow();
}

//----------------//
// 拠点一覧を描画 //
//----------------//
function drawVillageWindow() {
  j$("#mapboxInner").children().append("\
    <div id=villageWindow class=villageWindow> \
      <div class=villageheader> \
        <span>AutoBuilder Ver.0.01</span> \
      </div> \
      <div class=villagelistheader> \
        <span>対象拠点一覧</span> \
      </div> \
      <table id=villageList class=villagelist> \
      </table> \
      <div class=villagesubmenu> \
        <div><input type=checkbox id=al><label for=v1 class=highlight>拠点リストを自動で最新化</label></div> \
        <div><input type=checkbox id=ar><label for=v1>自動巡回</label></div> \
      </div> \
      <input id=builderSave class=saveButton type=button value='保存'> \
      <input id=builderClose class=closeButton type=button value='閉じる'> \
    </div> \
  ");
  j$("#builderSave").bind("click",
    function() {
    }
  );
  j$("#builderClose").bind("click",
    function() {
      j$("#settingWindow").css("display", "none");
      j$("#villageWindow").css("display", "none");
    }
  );

  // 拠点リストの状態を確認
  var villageList = loadVillageList();    // 保存された拠点情報
  var nowVillageList = getVillageList();    // 現在の拠点一覧
  for (var i = 0; i < villageList.length; i++) {
    var available = false;
    var current = false;
    for (var j = 0; j < nowVillageList.length; j++) {
      if ( villageList[i].x == nowVillageList[j].x && villageList[i].y == nowVillageList[j].y ) {
        available = true;
        current = nowVillageList[j].current;
        break;
      }
    }
    villageList[i].available = available;
    villageList[i].current = current;
  }

  // 拠点リストの再読み込みを行うかどうか
  if (1) {
    var hasUnavailable = false;
    for (var i = 0; i < villageList.length; i++) {
      if (villageList[i].available == false) {
        hasUnavailable = true;
        break;
      }
    }
    if (villageList.length !== nowVillageList.length || hasUnavailable == true) {
      // プロフィールをとりなおす
//      alert("拠点リストがずれてます！");
    }
  }

  // 拠点リストを描画
  for (var i = 0; i < villageList.length; i++) {
    var id = "v" + i;
    var addClass = "";
    var now = "0";
    if ( villageList[i].current == true ) {
      addClass = " class='current villagename'";
      now = "1";
    } else if (villageList[i].available == false) {
      addClass = " class='unknown'";
    } else {
      addClass = " class='villagename'";
    }
    var postText = "";
    if (now == "1") {
       postText = "<span>&nbsp;[現]</span>";
    }
    j$("#villageList").append(
      "<tr><td><input type=checkbox id=" + id + "><span id='label_" + id + "'" + addClass + ">" + villageList[i].name + "</span><span id='now_" + id + "' style='display:none;'>" + now + "</span>" + postText + "</td></tr>"
    );
    var data = [id, villageList[i].name, villageList[i].x, villageList[i].y];
    j$("#label_" + id).bind("click", data,
      function(data){
        // 情報設定
        j$("#villageList span[class*='current']").attr("class", "villagename");    // カレント拠点クラスをリセット
        j$("#label_" + data.data[0]).attr("class", "current villagename");
        j$("#villageName").text(data.data[1]);    // 拠点名
        j$("#villageX").text(data.data[2]);       // 座標X
        j$("#villageY").text(data.data[3]);       // 座標Y

        // 設定済み情報があれば書き戻す
        var options = loadVillageSettings(data.data[2], data.data[3]);
        setBuilderOptions(options);   // @TODO

        // 本拠地かどうかで描画情報を変える
        if (data.data[0] == 'v0') {
          j$("#baseVillage").text("(本拠地)");
          // 本拠地のみ研究所が設定可能
          j$("#" + CO_LABO).removeAttr("disabled");
          j$("label", j$("#" + CO_LABO).parent()).css("text-decoration", "none");
        } else {
          j$("#baseVillage").text("");
          j$("#" + CO_LABO).attr("disabled", "");
          j$("label", j$("#" + CO_LABO).parent()).css("text-decoration", "line-through");
        }

        // 選択された拠点が現拠点でない場合シミュレーションボタンは押せない
        if (j$("#now_" + data.data[0]).text() != "1") {
          j$("#execSimulator1").attr("disabled", "");
          j$("#execSimulator2").attr("disabled", "");
          j$("#execSimulator3").attr("disabled", "");
        } else {
          j$("#execSimulator1").removeAttr("disabled");
          j$("#execSimulator2").removeAttr("disabled");
          j$("#execSimulator3").removeAttr("disabled");
        }
        j$("#settingWindow").css("display", "block");
      }
    );
  }

//  // デフォルト設定
//  j$("#villageList").append(
//    "<tr><td>&nbsp;</td></tr><tr><td><input type=checkbox id=vn><label for=v1 class=new>※ デフォルト設定 ※</label></td></tr>"
//  );
}

//----------------//
// 設定画面を描画 //
//----------------//
function drawSettingWindow() {
  j$("#mapboxInner").children().append("\
    <div id=settingWindow class=builderWindow> \
      <div class=builderheader> \
        <span>拠点名：</span> \
        <span id=villageName>オートビルダー設定画面</span> \
        <span id=baseVillage></span> \
        <span id=villageX class='hidden'></span>\
        <span id=villageY class='hidden'></span>\
      </div> \
      <ul id=tabs class=buildertabs> \
      </ul> \
      <div id=body_tabs> \
      </div> \
      <input id=optionSaveButton class=builderbutton type=button value='保存する'> \
      <input id=optionCloseButton class=builderbutton type=button value='閉じる'> \
    </div> \
  ");

  j$("#optionSaveButton").bind('click',
    function() {
      var options = getBuilderOptions();
      saveVillageSettings(j$("#villageX").text(), j$("#villageY").text(), options);
      alert("保存しました");
    }
  );

  j$("#optionCloseButton").bind('click',
    function() {
      j$("#settingWindow").css("display", "none");
    }
  );

  // タブの描画
  var settings = getSettingViewContents();
  var count = 0;
  for (tabid in settings.tabs) {
    j$("#tabs").append(
      "<li id=" + tabid + ">" + settings.tabs[tabid] + "</li>"
    );
    j$("#body_tabs").append(
      "<div id=body_" + tabid + " class=buildertabbody style='display:none;'></div>"
    );

    // タブクリックイベント
    j$("#" + tabid).bind('click', tabid, function(p) {
      j$("#tabs li").each(function() {
        if (j$(this).attr("id") == p.data) {
          j$(this).attr("class", "selected");
          j$("#body_" + j$(this).attr("id")).css("display", "block");
        } else {
          j$(this).removeAttr("class");
          j$("#body_" + j$(this).attr("id")).css("display", "none");
        }
      });
    });
  }
  j$("#tabs li").eq(0).attr("class", "selected");
  j$("#body_tabs div").eq(0).css("display", "block");

  // タブ内コンテンツの描画（タブ名に依存関係が出てしまっているが楽するためベタに記述）
  var obj;

  // 建設[基本]
  j$("#body_tab1").append("<div class=contentsheader>建設 - 施設建造上限レベルの設定</div>");
  obj = drawTabTableContents(settings.contents['tab1']);
  j$("#body_tab1").append(obj);
  j$("#body_tab1").append("<input type=button id=execSimulator1 class=lbutton value=建設シミュレーターを開く>");
  j$("#execSimulator1").bind('click',
    function() {
      // シミュレーター画面を開く
      execSimulator();
    }
  );

  // 建設[拡張]
  j$("#body_tab2").append("<div class=contentsheader>建設 - 施設建造条件の設定</div>");
  obj = drawTabTableContents(settings.contents['tab2-1']);
  j$("#body_tab2").append(obj);
  j$("#body_tab2").append("<div class=contentsheader>個別建設設定（糧村化、倉庫村化指定時は本設定は無視されます）</div>");
  obj = drawTabTableContents(settings.contents['tab2-2']);
  j$("#body_tab2").append(obj);
  j$("#body_tab2").append("<span class=float-right><input type=checkbox id=" + CO_OFF +"><label for=v1>上記建設設定を無効にする</label></td></span>");
  j$("#body_tab2").append("<input type=button id=execSimulator2 class=lbutton value=建設シミュレーターを開く>");
  j$("#execSimulator2").bind('click',
    function() {
      // シミュレーター画面を開く
      execSimulator();
    }
  );

  // 建設[カスタム]
  j$("#body_tab3").append("<div class=contentsheader>建設 - 指定されたルールで拠点を作成</div>");
  j$("#body_tab3").append("<textarea id=customBox class=customBox value='' >");
  j$("#body_tab3").append("<input type=button id=analyze class=analyzeButton value=チェック＆コマンド分析>");
  j$("#body_tab3").append("<textarea id=analyzeBox class=analyzeBox readonly value='' >");
  j$("#body_tab3").append("<input type=button id=execSimulator3 class=lbutton2 value=建設シミュレーターを開く>");
  j$("#body_tab3").append("<span class=float-right><input type=checkbox id=" + CC_OFF +"><label for=v1>上記建設設定を無効にする</label></td></span>");
  j$("#analyze").bind('click',
    function() {
      // 入力されたカスタムコマンドを解析する
      try {
        var text = buildCustomCommandsText(analyzeCommand());
        j$("#analyzeBox").css("color", "white").text(text);
      } catch(e) {
        j$("#analyzeBox").css("color", "yellow").text(e);
      }
    }
  );
  j$("#execSimulator3").bind('click',
    function() {
      // シミュレーター画面を開く
      execSimulator();
    }
  );

  // 内政
  j$("#body_tab4").append("<div class=contentsheader>内政 - 自動発動内政スキルの設定</div>");
  obj = drawTabTableContents(settings.contents['tab4']);
  j$("#body_tab4").append(obj);
  j$("#body_tab4").append("\
    <div> \
      <span class=lspace><input type=checkbox id=" + CA_AVAILABLE + "><label for=v1>有効施設存在時のみ発動</label></td></span> \
      <span class=float-right><input type=checkbox id=" + CA_OFF + "><label for=v1>上記内政設定を無効にする</label></td></span> \
    </div>"
  );
}

//--------------------//
// シミュレーター起動 //
//--------------------//
function execSimulator() {
  collectVillageMap();  // マップデータをロード
  setSimulatorMap();

  // 初期化イベント実行
  j$("#simulatorInit").trigger('click');
  j$("#simulatorWindow").css("display", "block");
}

//----------------------//
// カスタムコマンド解析 //
//----------------------//
function analyzeCommand() {
  var lines = j$("#customBox").val().split(/[\n\r]/);

  // コマンド行を命令単位に分割
  var commandList = [];
  for (var i = 0; i < lines.length; i++) {
    // コメントとスペースを全部消す
    var command = lines[i].replace(/\/\/.*$/, "").replace(/ /g, "");
    var commands = command.split(/;/);
    for (var j = 0; j < commands.length; j++) {
      if (commands[j] == "") {
        continue;
      }
      commandList[commandList.length] = commands[j];
    }
  }

  // バリデーション＆命令変換
  var commands = [];
  for (var i = 0; i < commandList.length; i++) {
    // カンマつき命令をバラす
    if (commandList[i].indexOf(",") > 0) {
      var separateCommands = commandList[i].split(/,/);
      var parallelCommands = [];
      for (var j = 0; j < separateCommands.length; j++) {
        var results = generateCommand(separateCommands[j]);
        parallelCommands.push(results[0]);
      }
      commands.push(parallelCommands);
    } else {
      // パラメータ解析
      var results = generateCommand(commandList[i]);
      for (var j = 0; j < results.length; j++) {
        commands.push(results[j]);
      }
    }
  }
  return commands;
}

//------------------------------------------------//
// コマンド文字列をビルダー処理用の命令形式に変換 //
//------------------------------------------------//
function generateCommand(command) {
  if (typeof command == 'undefined') {
    return [];
  }
  // 施設別レベル
  var levelLimit = getLevelupLimit();
  var multiple = getMultipleBuild();

  // 施設名リスト
  var constructions = getConstrutionNumber();
  var buildCommand = [];
  if (command.match(/^(.*)=(.*|\*)>(.*|\*)$/) != null) {
    // バリデーション
    var construction = RegExp.$1;
    if (typeof constructions[construction] == 'undefined') {
      throw "ターゲット不正\n[" + command + "]";
    }
    var num = RegExp.$2;
    var level = RegExp.$3;
    if ( (num != '*' && isNaN(num)) || (level != '*' && isNaN(level)) ) {
      // 施設数とレベルには*か数値しか指定できない
      throw "数値部書式不正\n[" + command + "]";
    }
    if (parseInt(num) <= 0) {
      throw "施設数指定不正\n[" + command + "]";
    }
    if (parseInt(level) <= 0) {
      throw "レベル指定不正\n[" + command + "]";
    }

    // レベルと施設建設数を補正
    if (level == '*') {
      level = levelLimit[construction];
    } else if (level > levelLimit[construction]) {
      level = levelLimit[construction];
    }
    if (num != '*' && multiple[construction] == false) {
      num = 1;
    } else if(parseInt(num) > 99) {
      num = 99;
    }

    // コマンドを登録
    var obj = new Object;
    obj['construction'] = construction;
    obj['num'] = num;
    buildCommand.push(obj);
    obj = new Object;
    obj['construction'] = construction;
    obj['level'] = level;
    buildCommand.push(obj);
  } else if (command.match(/^(.*)([>=])(.*|\*)$/) != null) {
    // バリデーション
    var construction = RegExp.$1;
    var cmd = RegExp.$2;
    var num = RegExp.$3;
    if (construction != '空き地') {
      if (typeof constructions[construction] == 'undefined') {
        throw "ターゲット不正\n[" + command + "]";
      }
    }
    if (num != '*' && isNaN(num)) {
      // 施設名=数または*、施設名>数または*以外はフォーマットエラー
      throw "数値部書式不正\n[" + command + "]";
    }
    if (parseInt(num) <= 0) {
      throw "施設数指定不正\n[" + command + "]";
    }
    if (cmd == '>' && construction == '空き地') {
      // 空き地はレベルアップできない
      throw "空き地はレベルアップ不可\n[" + command + "]";
    }

    // レベルと施設建設数を補正
    if (cmd == '>') {
      if (num == '*') {
        num = levelLimit[construction];
      } else if (parseInt(num) > levelLimit[construction]) {
        num = levelLimit[construction];
      }
    } else {
      if (num != '*' && multiple[construction] == false) {
        num = 1;
      } else if(parseInt(num) > 99) {
        num = 99;
      }
    }

    // コマンドを登録
    var obj = new Object();
    obj['construction'] = construction;
    if (cmd == '=') {
      obj['num'] = num;
    } else {
      obj['level'] = num;
    }
    buildCommand.push(obj);
  } else {
    throw "解釈できない命令\n[" + command + "]";
  }

  return buildCommand;
}

//------------------------------//
// カスタムコマンドを画面に描画 //
//------------------------------//
function buildCustomCommandsText(commands) {
  var text = "";
  for (var i = 0; i < commands.length; i++) {
    if (commands[i].length == undefined) {
      for (key in commands[i]) {
        if (key == 'construction') {
          text += commands[i][key];
        } else if(key == 'num') {
          if (commands[i][key] < 50) {
            text += "を合計" + commands[i][key] + "個まで建設\n"
          } else {
            text += "をすべての空き地に建設\n"
          }
        } else if(key == 'level') {
          text += "をレベル" + commands[i][key] + "まで建設\n"
        }
      }
    } else {
      text += "以下の処理を均等に実行\n--\n";
      for (var j = 0; j < commands[i].length; j++) {
        for (key in commands[i][j]) {
          if (key == 'construction') {
            text += commands[i][j][key];
          } else if(key == 'num') {
            if (commands[i][j][key] < 50) {
              text += "を合計" + commands[i][j][key] + "個まで建設\n"
            } else {
              text += "をすべての空き地に建設\n"
            }
          } else if(key == 'level') {
            text += "をレベル" + commands[i][j][key] + "まで建設\n"
          }
        }
      }
      text += "--\n";
    }
  }
  return text;
}

//----------------------------//
// 設定画面内のコンテンツ作成 //
//----------------------------//
function drawTabTableContents(contents) {
  var obj = j$("<table class=contents>");
  for (var i = 0; i < contents.length; i++) {
    var lineText = "";
    for (var j = 0; j < contents[i].length; j++) {
      for (var k = 0; k < contents[i][j].length; k++) {
        var type = contents[i][j][k][0];
        var id = contents[i][j][k][1];
        var text = contents[i][j][k][2];
        if (type == TYPE_CHECKBOX) {
          // チェックボックス
          lineText += "<td><input type=checkbox id=" + id + "><label for=" + id + ">" + text + "</label></td>";
        } else if (type == TYPE_INPUT) {
          // テキスト
          lineText += "<td><input type=text id=" + id + " value=" + text + " size=2 class=rspace></td>";
        } else if (type == TYPE_LABEL) {
          // 見出し
          lineText += "<td colspan=99><span class=tableinfo>" + text + "</span></td>";
        } else if (type == TYPE_BLANK) {
          // ブランク
          lineText += "<td><span>&nbsp;</span></td>";
        }
      }
    }
    j$(obj).append("<tr>" + lineText + "</tr>");
  }
  return obj;
}

//--------------------------//
// シミュレーター画面を描画 //
//--------------------------//
function drawSimulatorWindow() {
  // 現在資源量の取得
  j$("#mapboxInner").children().append("\
    <div id=simulatorWindow class=simulatorWindow> \
      <div class=simulatorheader> \
        <span>建設シミュレーション（[基本] + [拡張] または、[カスタム]の設定を使用します。）</span> \
        <br> \
        <div> \
          <input type=checkbox id=infiniteResources class='checkbox'><label for=infiniteResources class='label'>資源無制限</label> \
          <span class='label'>木</span><input type=input size=8 id=woodResources class='inputbox' value='0'>\
          <span class='label'>石</span><input type=input size=8 id=stoneResources class='inputbox' value='0'>\
          <span class='label'>鉄</span><input type=input size=8 id=ironResources class='inputbox' value='0'>\
          <span class='label'>糧</span><input type=input size=8 id=foodResources class='inputbox' value='0'>\
          <input type=button id=refreshResources class='refreshButton' value='更新'>\
        </div> \
      </div> \
      <div id=body_simulator> \
      </div> \
    </div> \
  ");

  // 現在のマップデータを描画
  var html = "";
  for (var y = 0; y < 7; y++) {
    html += "<tr>";
    for (var x = 0; x < 7; x++) {
      var id = "villagemap_" + x + y;
      html += "<td id=" + id + ">" + x + "," + y + "</td>";
    }
    html += "</tr>";
  }
  j$("#body_simulator").append("<div style='float:left;'><table id=villagemap class='village'>" + html + "</table></div>");

  // 進捗テーブルの作成
  j$("#body_simulator").append("\
    <div style='position:relative; top:6px;'> \
      <input id=simulatorInit type='button' value='最初から'> \
      <input id=simulatorNext type='button' value='次の予定'> \
      <table style='position:relative; top: 4px; border: none; color: white;' id=simulateHistory> \
      </table> \
    </div>"
  );

  // 閉じるボタンの作成
  j$("#simulatorWindow").append("<input id=simulatorClose class=closeButton type='button' value='閉じる'>");
  j$("#simulatorClose").bind('click',
    function() {
      j$("#simulatorWindow").css("display", "none");
    }
  );

  // 資源量の設定
  j$("#refreshResources").bind('click',
    function() {
      setSimulatorResources();
    }
  );
  j$("#refreshResources").click();

  // 初期化イベントの定義
  j$("#simulatorInit").bind('click',
    function() {
      // 最終建築情報をリセット
      g_lastBuild = null;

      // マップデータをリセット
      collectVillageMap();
      setSimulatorMap();

      // 描画
      j$("#simulateHistory tr").remove();
      for (var i = 0; i < g_buildList.length; i++) {
        if (g_buildList[i].status == STATUS_DELETE) {
          continue;
        }

        var x = g_buildList[i].x;
        var y = g_buildList[i].y;

        // 進捗行の書き込み
        var statusText = "";
        var frontColor = "white";
        if (g_buildList[i].status == STATUS_NOWBUILD) {
          statusText = "[建]";
          frontColor = "yellow";
        } else {
          statusText = "[予]";
          frontColor = "cyan";
        }
        if (g_buildList[i].level > 0) {
          g_buildMode = TYPE_LEVELUP;
        } else {
          g_buildMode = TYPE_BUILD;
        }

        setSimulatorHistory(x, y, g_buildList[i].construction, g_villageMap[x][y].level, frontColor, statusText);

        // レベル加算
        g_villageMap[x][y].level ++;

        // マップへの表示反映
        setSimulatorMapByPosition(x, y, frontColor);
      }
    }
  );

  // 次へイベントの定義
  j$("#simulatorNext").bind('click',
    function() {
      var isBase = false;
      if (j$("#baseVillage").text("") != "") {
        isBase = true;
      }

      var target = getNextBuildTarget(isBase, true);
      if (target == null) {
        alert("対象施設がありません");
      } else {
        // シミュレーターの資源を減らす
        var resources = getResources(true);
        if (resources.infinite == false) {
           var cost = getBuildResources(target.construction, target.level);
           j$("#woodResources").val(resources.wood - cost.wood);
           j$("#stoneResources").val(resources.stone - cost.stone);
           j$("#ironResources").val(resources.iron - cost.iron);
           j$("#foodResources").val(resources.food - cost.food);
        }

        // 建設データを描画
        setSimulatorHistory(target.x, target.y, target.construction, target.level, "white", "");
        g_villageMap[target.x][target.y].level ++;
        if (g_lastBuild) {
          // 直前のマークを消す
          setSimulatorMapByPosition(g_lastBuild.x, g_lastBuild.y, "white");
        }
        setSimulatorMapByPosition(target.x, target.y, "white", "darkred");
        g_lastBuild = g_villageMap[target.x][target.y];
      }
    }
  );
}

//------------------------------------------------//
// シミューレーター画面に現拠点マップデータを描画 //
//------------------------------------------------//
function setSimulatorMap() {
  for (y = 0; y < 7; y++) {
    for (x = 0; x < 7; x++) {
      setSimulatorMapByPosition(x, y, 'white');
    }
  }
}

//--------------------------------//
// シミュレーターに情報を書き込む //
//--------------------------------//
function setSimulatorMapByPosition(x, y, color, backcolor) {
  var shortName = getShortName(g_villageMap[x][y].construction);
  var bgColor;
  if (typeof backcolor == 'undefined') {
    bgColor = getColor(shortName);
  } else {
    bgColor = backcolor;
  }
  var id = "villagemap_" + x + y;
  if (g_villageMap[x][y].level > 0) {
    html = "<span>Lv." + g_villageMap[x][y].level + "</span>";
  } else {
    html = "<span>　</span>";
    shortName = "　";
  }
  j$("#" + id).html(html + "<br><span>" + shortName + "</span>");
  j$("#" + id).css("background-color", bgColor);
  j$("#" + id).css("color", color);
}

//------------------------------//
// シミュレーターの資源量を更新 //
//------------------------------//
function setSimulatorResources() {
  j$("#woodResources").val(j$("#wood").text());
  j$("#stoneResources").val(j$("#stone").text());
  j$("#ironResources").val(j$("#iron").text());
  j$("#foodResources").val(j$("#rice").text());
}

//--------------------------------------//
// シミュレーターの履歴に情報を書き込む //
//--------------------------------------//
function setSimulatorHistory(x, y, construction, level, color, subtext) {
  var nextLevel = parseInt(level) + 1;
  if (j$("#simulateHistory tr").length > 18) {
    j$("#simulateHistory tr").eq(0).remove();
  }
  if (g_buildMode == TYPE_BUILD) {
    j$("#simulateHistory").append(
      "<tr><td style='color:" + color + "'>" +
        "(" + x + "," + y + ") 空き地 -> "  + construction + " Lv." + nextLevel + " " + subtext +
      "</td></tr>"
    );
  } else {
    j$("#simulateHistory").append(
      "<tr><td style='color:" + color + "'>" +
        "(" + x + "," + y + ") " + construction + " Lv." + level + " -> Lv." + nextLevel + " " + subtext +
      "</td></tr>"
    );
  }
}

//------------------------------//
// パネルに対応するカラーを取得 //
//------------------------------//
function getColor(headName) {
  if (headName == "森") {
    return "#00C000";
  }
  if (headName == "岩") {
    return "#dcdcdc";
  }
  if (headName == "鉄") {
    return "#d2691e";
  }
  if (headName == "穀") {
    return "#ffd700";
  }
  if (headName == "荒") {
    return "#606060";
  }
  return "#003000";
}

//--------------------//
// 次回建設対象の取得 //
//--------------------//
function getNextBuildTarget(isBase, isSimulate) {
  // 設定オプションを取得
  var options = getBuilderOptions();

  // 施設別のオプションを取得
  var constructOptions = getConstructionOptions();

  // カスタム建設(一時保留)
/*
  var customCommands = [];
  if (options[CC_OFF] == false) {
    customCommands = analyzeCommand();
  }
  if (customCommands.length > 0) {
    return getCustomTarget(customCommands, isBase, isSimulate);
  }
*/
  // 拡張建設が有効かつ必要な空き地がある場合、新規建設判定を行う
  var target = null;
  if (options[CO_OFF] == false) {
    // 建設可能な施設を調査
    target = getNewBuildConstructionTarget(options, constructOptions, isBase, isSimulate);
    if (target != null) {
      g_buildMode = TYPE_BUILD;
      return getCreateTarget(target);
    }
  }

  // レベルアップ可能施設の判定を行う
  if (target == null) {
    target = getLevelupConstructionTarget(options, constructOptions, isSimulate);
    if (target != null) {
      g_buildMode = TYPE_LEVELUP;
      return getLevelupTarget(target);
    }
  }
  return null;
}

//--------------------------------//
// 建設済み施設に関する情報を取得 //
//--------------------------------//
function countConstructions(order) {
  // 施設数リストを作る
  var counts = {};
  var levels = {};
  for (var y = 0; y < 7; y++) {
    for (var x = 0; x < 7; x++) {
      var construction = g_villageMap[x][y].construction;
      if (typeof counts[construction] == 'undefined') {
        counts[construction] = 1;
        levels[construction] = g_villageMap[x][y].level;
      } else {
        counts[construction] ++;
        if (order == 'count') {
          // カウントの場合は最大レベルを記録
          if (g_villageMap[x][y].level > levels[construction]) {
            levels[construction] = g_villageMap[x][y].level;
          }
        } else {
          // レベルの場合は最小レベルを記録
          if (g_villageMap[x][y].level < levels[construction]) {
            levels[construction] = g_villageMap[x][y].level;
          }
        }
      }
    }
  }

  // 配列を組み替える
  var sorts = [];
  for (construction in counts) {
    var data = {};
    data['con'] = construction;
    data['count'] = counts[construction];
    data['level'] = levels[construction];
    sorts[sorts.length] = data;
  }
  if (order == 'count') {
    sorts.sort(function(a,b) {
      return a['count'] - b['count'];
    });
  } else {
    sorts.sort(function(a,b) {
      return a['level'] - b['level'];
    });
  }

  var csCount = {};
  for (var i = 0; i < sorts.length; i++) {
    csCount[sorts[i]['con']] = new Object();
    csCount[sorts[i]['con']].construction = sorts[i]['con'];
    csCount[sorts[i]['con']].count = sorts[i]['count'];
    csCount[sorts[i]['con']].level = sorts[i]['level'];
  }

  return csCount;
}

//--------------------------//
// 建設可能な新規施設を返す //
//--------------------------//
function getNewBuildConstructionTarget(options, constructOptions, isBase, isSimulate) {
  // 建設条件ルールを取得
  var rules = getConstructionRules();

  // 拠点内の施設数を数える（カウントオーダー）
  var csCount = countConstructions('count');

  // 空き地数を数える
  var blankCount = 0;
  if (options[CO_HAS_EMPTY] == false) {
    if (typeof csCount['空き地'] == 'undefined') {
      blankCount = 0;
    } else {
      blankCount = csCount['空き地'].count;
    }
  } else {
    if (typeof csCount['空き地'] == 'undefined') {
      return null;
    }
    if (csCount['空き地'].count <= parseInt(options[TO_HAS_EMPTY])) {
      return null;
    } else {
      blankCount = csCount['空き地'].count - parseInt(options[TO_HAS_EMPTY])
    }
  }

  // 資源量取得
  var resources = getResources(isSimulate);

  // 建設可能な未建設新規施設が残っているか
  var target = null;
  var restCount = 0;
  for (construction in rules) {
    // すでに建設対象が決まっている場合は飛ばす
    if (target != null) {
      continue;
    }
    // 本拠地以外に研究所は建てられない
    if (target == '研究所' && isBase == false) {
      continue;
    }
    // 該当施設が存在しているか
    if (typeof csCount[construction] != 'undefined') {
      continue;
    }
    // 建設対象か
    if (typeof options[constructOptions[construction].create] == 'undefined') {
      continue;
    }
    if (options[constructOptions[construction].create] == false) {
      continue;
    }

    // 未建設施設数加算
    restCount ++;

    // 建設できるかを取得
    var isBuild = isCanBuild(rules, csCount, construction, resources);

    // 建設対象施設を確定
    if (isBuild == true) {
      var resource = new Object();
      resource['construction'] = construction;
      target = resource;
    }
  }
  if (target != null) {
    return target;
  }

  // 未建設施設をすべて建てると空き地が無くなる場合は建設できない
  if (blankCount <= restCount) {
    return null;
  }

  // 建設施設数の少ない順にソート
  for (construction in csCount) {
    // 対象外施設は除外
    if (typeof constructOptions[construction] == 'undefined') {
      continue;
    }

    // 複数施設建設の対象でなければ除外
    if (typeof constructOptions[construction].num == 'undefined') {
      continue;
    }

    // 建設対象外は除外
    if (typeof options[constructOptions[construction].create] == 'undefined') {
      continue;
    }
    if (options[constructOptions[construction].create] == false) {
      continue;
    }

    // 施設数が足りていれば除外
    if (parseInt(options[constructOptions[construction].num]) <= parseInt(csCount[construction].count)) {
      continue;
    }

    // 建設できる条件を満たしていれば建設対象とする
    if (isCanBuild(rules, csCount, construction, resources) == true) {
      target = csCount[construction];
      break;
    }
  }

  return target;
}

//--------------------//
// 建設可能か判定する //
//--------------------//
function isCanBuild(rules, csCount, construction, resources) {
  // 建設条件ないばあい
  if (rules[construction].length == 0) {
    var cost = getBuildResources(construction, 0);
    if (resources.wood < cost.wood || resources.stone < cost.stone || resources.iron < cost.iron || resources.food < cost.food ) {
      return false;
    }
    return true;
  }

  // 建設判定する
  var isBuild = false;
  for (var i = 0; i < rules[construction].length; i++) {
    // 必須施設のチェック
    if (typeof csCount[rules[construction][i].con] == 'undefined') {
      if (typeof rules[construction][i].check == 'undefined') {
        // 施設必須なので建設不可
        continue;
      } else {
        // 他拠点チェックで存在しない場合建設不可(ビルダー実行時は建設確認を必ず行う)
      }
    }

    // 必須施設レベルチェック
    if (csCount[rules[construction][i].con].level < rules[construction][i].lv) {
      continue;
    }

    // 伐採所、石切り場、製鉄所は建設場所があるかをきちんと確認する
    if (isBuildResourceConstruction(construction) == false) {
      continue;
    }

    // 資源チェック
    if (resources.infinite != true) {
      var cost = getBuildResources(construction, 0);
      if (resources.wood < cost.wood || resources.stone < cost.stone || resources.iron < cost.iron || resources.food < cost.food ) {
        continue;
      }
      isBuild = true;
      break;
    } else {
      isBuild = true;
      break;
    }
  }
  return isBuild;
}

//--------------------------------------------------//
// 資源パネルのとき、建設対象の空き地があるかを確認 //
//--------------------------------------------------//
function isBuildResourceConstruction(construction) {
  if (construction != '伐採所' && construction != '石切り場' && construction != '製鉄所') {
    return true;
  }
  for (var y = 0; y < 7; y++) {
    for (var x = 0; x < 7; x++) {
      if (g_villageMap[x][y].construction == '空き地') {
        if (construction == '伐採所' && g_villageMap[x][y].forest > 0) {
          return true;
        }
        if (construction == '石切り場' && g_villageMap[x][y].stone > 0) {
          return true;
        }
        if (construction == '製鉄所' && g_villageMap[x][y].iron > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

//------------------------------//
// レベルアップ可能な施設を返す //
//------------------------------//
function getLevelupConstructionTarget(options, constructOptions, isSimulate) {
  // 拠点内の施設数を数える（レベルオーダー）
  var csCount = countConstructions('level');

  var levelLimit = getLevelupLimit();

  // 資源量取得
  var resources = getResources(isSimulate);

  var target = null;
  for (construction in csCount) {
    // 拠点は参照施設名を変更
    var optionTarget;
    if (construction == '村' || construction == '砦' || construction == '城') {
      optionTarget = '拠点';
    } else {
      optionTarget = construction;
    }

    // 対象外施設は除外
    if (typeof constructOptions[optionTarget] == 'undefined') {
      continue;
    }

    // レベルアップ対象外は除外
    if (options[constructOptions[optionTarget].levelup] == false) {
      continue;
    }

    // レベル上限超えてたら除外(設定値)
    if (parseInt(options[constructOptions[optionTarget].max]) <= parseInt(csCount[construction].level)) {
      continue;
    }

    // レベル上限超えてたら除外(システム上限)
    if (parseInt(levelLimit[construction]) <= parseInt(csCount[construction].level)) {
      continue;
    }

    // 資源チェック
    if (resources.infinite != true) {
      var cost = getBuildResources(construction, parseInt(csCount[construction].level));
      if (resources.wood < cost.wood || resources.stone < cost.stone || resources.iron < cost.iron || resources.food < cost.food ) {
        continue;
      }
    }

    // すべてのチェックを通過したら建設対象
    target = csCount[construction];
    break;
  }
  return target;
}

//------------------------//
// カスタム建設のチェック //
//------------------------//
function getCustomTarget(customCommands, isBase, isSimulate) {
  // 建設条件ルールを取得
  var rules = getConstructionRules();

  // 拠点内の施設数を数える（カウントオーダー）
  var csCount = countConstructions('count');
  // 空き地数を数える
  var blankCount = 0;
  if (typeof csCount['空き地'] == 'undefined') {
    blankCount = 0;
  } else {
    blankCount = csCount['空き地'].count;
  }
/*
  // 1件づつコマンドを処理する
  for (var i = 0; i < commands.length; i++) {
    // 単独命令
    if (commands[i].length == undefined) {
      var construction = commands[i]['construction'];
      // 施設数判定
      if (typeof commands[i]['num'] != 'undefined') {
        if (typeof csCount[construction] != 'undefined') {
          // 指定数まで施設がつくられていたらこの処理は飛ばす
          if (csCount[construction] >= commands[i]['num']) {
            continue;
          }
        }

        // 建設条件を満たしているかチェック
        if (!isCanBuild(rules, csCount, construction, isCheckResource)) {
          continue;
        }

        // 建設対象として設定
        return csCount[construction];
      }

      for (key in commands[i]) {
        var construction = commands[i]['construction'];
        if (typeof commands[i]['num'] != 'undefined') {
        }
        if (key == 'construction') {
          text += commands[i][key];
        } else if(key == 'num') {
          if (commands[i][key] != '*') {
            text += "を合計" + commands[i][key] + "個まで建設\n"
          } else {
            text += "をすべての空き地に建設\n"
          }
        } else if(key == 'level') {
          if (commands[i][key] != '*') {
            text += "をレベル" + commands[i][key] + "まで建設\n"
          } else {
            text += "を最大レベルまで建設\n"
          }
        }
      }
    } else {
      text += "以下の処理を均等に実行\n--\n";
      for (var j = 0; j < commands[i].length; j++) {
        for (key in commands[i][j]) {
          if (key == 'construction') {
            text += commands[i][j][key];
          } else if(key == 'num') {
            if (commands[i][j][key] != '*') {
              text += "を合計" + commands[i][j][key] + "個まで建設\n"
            } else {
              text += "をすべての空き地に建設\n"
            }
          } else if(key == 'level') {
            if (commands[i][j][key] != '*') {
              text += "をレベル" + commands[i][j][key] + "まで建設\n"
            } else {
              text += "を最大レベルまで建設\n"
            }
          }
        }
      }
      text += "--\n";
    }
*/
}

//--------------------------//
// 新規建設場所の情報を得る //
//--------------------------//
function getCreateTarget(target) {
  var sorts = [];
  for (var y = 0; y < 7; y++) {
    for (var x = 0; x < 7; x++) {
      // 空き地以外は除外
      if (g_villageMap[x][y].construction != '空き地') {
        continue;
      }
      var data = {};
      data['x'] = x;
      data['y'] = y;
      data['forest'] = g_villageMap[x][y].forest;
      data['stone'] = g_villageMap[x][y].stone;
      data['iron'] = g_villageMap[x][y].iron;
      data['food'] = g_villageMap[x][y].food;
      data['blank'] = g_villageMap[x][y].blank;
      data['resources'] = g_villageMap[x][y].resources;
      sorts[sorts.length] = data;
    }
  }
  if (sorts.length == 0) {
    return null;
  }
  sorts.sort(
    function(a,b){
      if (target.construction == '伐採所') {
        return b['forest'] - a['forest'];
      }
      if (target.construction == '石切り場') {
        return b['stone'] - a['stone'];
      }
      if (target.construction == '製鉄所') {
        return b['iron'] - a['iron'];
      }
      if (target.construction == '水車') {
        return b['food'] - a['food'];
      }
      if (a['blank'] != b['blank']) {
        return a['blank'] - b['blank'];
      }
      return a['resources'] - b['resources'];
    }
  );

  // 建設施設を埋める
  var x = sorts[0]['x'];
  var y = sorts[0]['y'];
  g_villageMap[x][y].construction = target.construction;
  return g_villageMap[x][y];
}

//------------------------------//
// レベルアップ施設の情報を得る //
//------------------------------//
function getLevelupTarget(target) {
  for (var y = 0; y < 7; y++) {
    for (var x = 0; x < 7; x++) {
      if (target.construction == g_villageMap[x][y].construction && target.level == g_villageMap[x][y].level) {
        return g_villageMap[x][y];
      }
    }
  }
  return null;
}

//--------------------------//
// マップデータ読み込み     //
//--------------------------//
function collectVillageMap() {
  // 拠点施設リストの作成
  var mapData = [];
  for( var x = 0; x < 7; x++ ){
    mapData[x] = [];
    for( var y = 0; y < 7; y++ ){
      mapData[x][y] = new Object;
      mapData[x][y].x = x;
      mapData[x][y].y = y;
      mapData[x][y].level = 0;
      mapData[x][y].construction = "";
      mapData[x][y].forest = 0;
      mapData[x][y].stone = 0;
      mapData[x][y].iron = 0;
      mapData[x][y].food = 0;
      mapData[x][y].blank = 0;
      mapData[x][y].resources = 0;
    }
  }

  // マップチップから現在レベル、施設名を取得
  j$("#maps img[class*='map']").each(
    function() {
      var className = j$(this).attr("class");
      var mapIcon = false;
      if (className.match(/mapicon/) != null) {
        mapIcon = true;
        j$(this).attr("class").match(/mapicon(\d+)/);
      } else {
        j$(this).attr("class").match(/map(\d+)/);
      }
      var y = (RegExp.$1 - 1) % 7;
      var x = Math.floor((RegExp.$1 - 1) / 7);
      var levelData = j$(this).attr("src").match(/img_lv(\d+)/);
      if (levelData != null) {
        mapData[x][y].level = RegExp.$1;
      } else {
        if (mapIcon == true) {
          // なんらかの理由でレベルが取れない場合、mapiconクラス側からとる
          var area = j$("#mapOverlayMap area[href*='x=" + x + "&y=" + y + "']");
          if (j$(area).length > 0) {
            var findLv = j$(area).attr("title").match(/L[Vv].(\d+)/);
            if (findLv != null) {
              mapData[x][y].level = findLv[1];
            }
          }
        }
        var imgUrl = j$(this).attr("src");
        if (imgUrl.match(/facility_(\d+)/) != null) {
          mapData[x][y].construction = convertConstructionIdToName(RegExp.$1);
        } else if (imgUrl.match(/blank.png/) != null) {
          mapData[x][y].construction = "空き地";
        }
      }
    }
  );

  // 建設、削除中施設の情報を取得
  var buildList = [];
  j$("#actionLog ul li").each(
    function() {
      // 建設ステータスの取得
      var statusText = j$("span[class='buildStatus']", this).parent().text();
      var status = "";
      if (statusText.match(/削除中/) != null) {
        status = STATUS_DELETE;
      } else if (statusText.match(/建設準備中/) != null) {
        status = STATUS_PROMISE;
      } else if (statusText.match(/建設中/) != null) {
        status = STATUS_NOWBUILD;
      } else {
        return;
      }

      // 座標
      var target =j$("a", this);
      j$(target).attr("href").match(/x=(\d+)&y=(\d+)/);
      var x = RegExp.$1;
      var y = RegExp.$2;

      // 施設名
      j$(target).text().match(/(.*)\(/);
      var construction = RegExp.$1;

      // 残り時間
      j$("span[id*='area_timer']", this).text().match(/(\d+):(\d+):(\d+)/);
      var restTime = parseInt(RegExp.$1) * 24 * 60 + parseInt(RegExp.$2) * 60 + parseInt(RegExp.$3);

      // 予定表には積み上げる
      var build = new Object;
      build.x = x;
      build.y = y;
      build.level = mapData[x][y].level;
      build.status = status;
      build.construction = construction;
      buildList.push(build);

      if (typeof mapData[x][y].restTime != 'undefined') {
        // 同一座標にすでに建設計画がいる場合マップデータは更新しない
        return;
      }

      mapData[x][y].status = status;
      mapData[x][y].construction = construction;
      mapData[x][y].restTime = restTime;
    }
  );

  // 隣接資源の設定
  var checkPositions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (var x = 0; x < 7; x++) {
    for (var y = 0; y < 7; y++){
      for (var k = 0; k < 4; k++) {
        var divx = checkPositions[k][0];
        var divy = checkPositions[k][1];
        if (x + divx < 0 || x + divx > 6 || y + divy < 0 || y + divy > 6) {
          continue;
        }
        if (mapData[x + divx][y + divy].construction == '森林') {
          mapData[x][y].forest ++;
          mapData[x][y].resources ++;
        }
        if (mapData[x + divx][y + divy].construction == '岩山') {
          mapData[x][y].stone ++;
          mapData[x][y].resources ++;
        }
        if (mapData[x + divx][y + divy].construction == '鉄鉱山') {
          mapData[x][y].iron ++;
          mapData[x][y].resources ++;
        }
        if (mapData[x + divx][y + divy].construction == '穀物') {
          mapData[x][y].food ++;
          mapData[x][y].resources ++;
        }
        if (mapData[x + divx][y + divy].construction == '空き地') {
          mapData[x][y].blank ++;
        }
      }
    }
  }
  // 結果を代入
  g_villageMap = mapData;
  g_buildList = buildList;
}

//------------------------------//
// 画面で設定された設定値を取得 //
//------------------------------//
function getBuilderOptions() {
  var saveOptions = {};

  // 建設設定[基本]
  for(var i = 0; i < g_saveBuilderOptionList1.length; i++) {
    var key = g_saveBuilderOptionList1[i];
    var value;
    if (j$("#" + key).attr("type") == 'checkbox') {
      value = j$("#" + key).prop('checked');
    } else {
      // 施設レベルのため、0なら1に修正
      value = parseInt(j$("#" + key).val());
      if (value == 0) {
        value = 1;
      }
    }
    saveOptions[key] = value;
  }

  // 建設設定[拡張]
  var check_saveBuilderOptionList2 = [];
  if (j$("#" + CO_FOOD_BASE).prop('checked') == true) {
    // 糧村化
    saveOptions[CO_FOOD] = true;
    saveOptions[TO_FOOD] = 99;
    saveOptions[CO_SYMBOL] = true;
    saveOptions[CO_OFF] = j$("#" + CO_OFF).prop('checked');
    check_saveBuilderOptionList2 = [
      CO_HAS_EMPTY, TO_HAS_EMPTY
    ];
  } else if (j$("#" + CO_STORAGE_BASE).prop('checked') == true) {
    // 倉庫村化
    saveOptions[CO_FOOD] = true;
    saveOptions[TO_FOOD] = 1;
    saveOptions[CO_STORAGE] = true;
    saveOptions[TO_STORAGE] = 99;
    saveOptions[CO_SYMBOL] = true;
    saveOptions[CO_OFF] = j$("#" + CO_OFF).prop('checked');
    check_saveBuilderOptionList2 = [
      CO_HAS_EMPTY, TO_HAS_EMPTY
    ];
  } else {
    // グローバル変数を壊さないように再代入
    for(var i = 0; i < g_saveBuilderOptionList2.length; i++) {
      check_saveBuilderOptionList2[check_saveBuilderOptionList2.length] = g_saveBuilderOptionList2[i];
    }
  }

  for(var i = 0; i < check_saveBuilderOptionList2.length; i++) {
    var key = check_saveBuilderOptionList2[i];
    var value;
    if (j$("#" + key).attr("type") == 'checkbox') {
      value = j$("#" + key).prop('checked');
    } else {
      // 施設建設数のため0なら1に補正
      value = parseInt(j$("#" + key).val());
      if (value == 0) {
        value = 1;
      }
    }
    saveOptions[key] = value;
  }

  // 建設設定(カスタム)
  for(var i = 0; i < g_saveBuilderOptionList3.length; i++) {
    var key = g_saveBuilderOptionList3[i];
    var value;
    if (j$("#" + key).attr("type") == 'checkbox') {
      value = j$("#" + key).prop('checked');
    } else {
      value = parseInt(j$("#" + key).val());
      if (value == 0) {
        value = 1;
      }
    }
    saveOptions[key] = value;
  }

  // 内政設定
  for(var i = 0; i < g_saveBuilderOptionList4.length; i++) {
    var key = g_saveBuilderOptionList4[i];
    var value;
    if (j$("#" + key).attr("type") == 'checkbox') {
      value = j$("#" + key).prop('checked');
    } else {
      value = parseInt(j$("#" + key).val());
      if (value == 0) {
        value = 1;
      }
    }
    saveOptions[key] = value;
  }

  return saveOptions;
}

//------------------------------//
// 画面で設定された設定値を取得 //
//------------------------------//
function setBuilderOptions(options) {
/*
  if (options.length == 0) {
    // 復元処理
  } else {
    for (key in options) {
      if (key[0] == TYPE_CHECKBOX) {
        j$("#" + key).prop('checked', options[key]);
      } else {
        j$("#" + key).val(options[key]);
      }
    }
  }
*/
}

//--------------------//
// スクリプト実行判定 //
//--------------------//
function isExecute() {
  // mixi鯖障害回避用: 広告iframe内で呼び出されたら無視
  if (j$("#container").length == 0) {
    return false;
  }

  // 歴史書モードの場合、ツールを動かさない
  if( j$("a[title=歴史書を見る]").length > 0 ){
    return false;
  }
  return true;
}

//------------------//
// セッションID取得 //
//------------------//
function getSessionId() {
  // コメントフォームからセッションIDを取得
  var match = j$("div[class=commentform]").html().match(/\n\'(.*)\'\n/);
  if( match == null || match == undefined ){
    match = j$("div[class=commentbtn]").html().match(/get_chat_data\(.*,.*,'(.*)'\);/);
  }
  if( match == null || match == undefined ){
    return null;
  }
  return match[1];
}

//----------------------------------//
// 拠点情報をオブジェクトに変換する //
//----------------------------------//
function VillageObject(vId, vName, vPosX, vPosY) {
  // 保存されている座標情報を取得
  var villageInfo = loadVillageInfo(vPosX, vPosY);
  if (villageInfo != false) {
    // 拠点情報がとれた場合は、拠点IDと拠点名を書き換える
    this.id = vId;                                // 拠点ID
    this.name = vName;                            // 拠点名
    this.x = villageInfo.x;                       // 拠点x座標
    this.y = villageInfo.y;                       // 拠点y座標
    this.hasWood = villageInfo.hasWood;           // 伐採所有無
    this.hasStone = villageInfo.hasStone;         // 石切り場有無
    this.hasMarket = villageInfo.hasMarket;       // 市場有無
    this.builduptime = villageInfo.builduptime;   // 建設中施設完了時刻(null=建設なし)
    this.lastNewBuild = villageInfo.lastNewBuild; // 新規建設をかけた場合、その情報が入る
    this.roundgo = villageInfo.roundgo;           // 巡回許可
    this.buildOptions = villageInfo.buildOptions; // 拠点別建設オプション
    this.error = "";                              // エラー制御
  } else {
    // 新規拠点
    this.id = vId;                                // 拠点ID
    this.name = vName;                            // 拠点名
    this.x = vPosX;                               // 拠点x座標
    this.y = vPosY;                               // 拠点y座標
    this.hasWood = false;                         // 伐採所有無
    this.hasStone = false;                        // 石切り場有無
    this.hasMarket = false;                       // 市場有無
    this.builduptime = null;                      // 建設中施設完了時刻(null=建設なし)
    this.lastNewBuild = null;                     // 新規建設をかけた場合、その情報が入る
    this.roundgo = false;                         // 巡回許可
    this.buildOptions = null;                     // 拠点別建設オプション
    this.error = "";                              // エラー制御
  }

  return this;
}

//----------------------//
// 現在の拠点一覧を取得 //
//----------------------//
function getVillageList() {
  var list = [];
  j$("div[class='sideBoxInner basename'] ul li").each(
    function(index){
      var current = false;
      if ( j$(this).attr("class") == 'on') {
        current = true;
      }
      var search;
      if (current == true) {
        search = j$("span", this).attr("title").match(/^(.*) \(([-]*\d+),([-]*\d+)\)/);
      } else {
        search = j$("a", this).eq(0).attr("title").match(/^(.*) \(([-]*\d+),([-]*\d+)\)/);
      }
      var pushObj = new Object();
      pushObj['current'] = current;
      pushObj['name'] = RegExp.$1;
      pushObj['x'] = RegExp.$2;
      pushObj['y'] = RegExp.$3;
      list.push(pushObj);
    }
  );
  return list;
}

//------------------//
// 拠点リストを保存 //
//------------------//
function saveVillageList(newVillageList) {
  GM_setValue(GM_KEY + "VillageList", JSON.stringify(newVillageList));
}

//------------------//
// 拠点リストを取得 //
//------------------//
function loadVillageList() {
  var villageData = GM_getValue(GM_KEY + "VillageList", "");
  if (villageData == "") {
    return [];
  }
  return JSON.parse(villageData);
}

//------------------------------//
// 拠点のビルダー設定情報を保存 //
//------------------------------//
function saveVillageSettings(x, y, options) {
  var key = GM_KEY + "Village_" + x + "_" + y;
  GM_setValue(key, JSON.stringify(options));
}

//------------------------------//
// 拠点のビルダー設定情報を取得 //
//------------------------------//
function loadVillageSettings(x, y) {
  var key = GM_KEY + "Village_" + x + "_" + y;
  var villageSettings = GM_getValue(key, "");
  if (villageSettings == "") {
    return [];
  }
  return JSON.parse(villageSettings);
}

//--------------------------------------//
// 座標に対応するビルダー建設情報を取得 //
//--------------------------------------//
function loadVillageInfo(x, y){
  // 該当拠点が拠点リストにあるか
  var villageList = loadVillageList();
  if( villageList.length == 0 ) {
    return false;
  }

  for( var i = 0; i < villageList.length; i++ ) {
    if( villageList[i].x == x && villageList[i].y == y ) {
      return villageList[i];
    }
  }

  return false;
}

//----------------//
// 現在資源量取得 //
//----------------//
function getResources(isSimulate) {
  var resources = new Object();
  resources.infinite = false;
  if (isSimulate == true) {
    if (j$("#infiniteResources").prop('checked') == true) {
      resources.infinite = true;
    }
    resources.wood = j$("#woodResources").val();
    resources.stone = j$("#stoneResources").val();
    resources.iron = j$("#ironResources").val();
    resources.food = j$("#foodResources").val();
  } else {
    resources.wood = j$("#wood").text();
    resources.stone = j$("#stone").text();
    resources.iron = j$("#iron").text();
    resources.food = j$("#rice").text();
  }

  return resources;
}

//----------//
// 画面定義 //
//----------//
function getSettingViewContents() {
  var tabSettings = {
    'tab1':'建設設定[基本]',
    'tab2':'建設設定[拡張]',
    'tab3':'建設設定[カスタム]',
    'tab4':'内政設定',
    'tab5':'市場設定'
  };

  // 各種設定
  var tables = {
    // 建設施設リスト
    'tab1': [
      [
        [[TYPE_LABEL, '', '拠点　　　'], [TYPE_INPUT, TL_BASE,      20]],
        [[TYPE_LABEL, '', '練兵所　　'], [TYPE_INPUT, TL_PARADE,    10]],
        [[TYPE_LABEL, '', '訓練所　　'], [TYPE_INPUT, TL_TRAINING,  10]],
        [[TYPE_LABEL, '', '市場　　　'], [TYPE_INPUT, TL_MARKET,    10]],
      ],
      [
        [[TYPE_LABEL, '', '伐採所　　'], [TYPE_INPUT, TL_WOOD,      15]],
        [[TYPE_LABEL, '', '宿舎　　　'], [TYPE_INPUT, TL_LODGE,     15]],
        [[TYPE_LABEL, '', '遠征訓練所'], [TYPE_INPUT, TL_EXPEDITE,  20]],
        [[TYPE_LABEL, '', '研究所　　'], [TYPE_INPUT, TL_LABO,      10]],
      ],
      [
        [[TYPE_LABEL, '', '石切り場　'], [TYPE_INPUT, TL_STONE,     15]],
        [[TYPE_LABEL, '', '大宿舎　　'], [TYPE_INPUT, TL_L_LODGE,   20]],
        [[TYPE_LABEL, '', '見張り台　'], [TYPE_INPUT, TL_W_TOWER,   20]],
        [[TYPE_LABEL, '', '銅雀台　　'], [TYPE_INPUT, TL_SYMBOL,    10]],
      ],
      [
        [[TYPE_LABEL, '', '製鉄所　　'], [TYPE_INPUT, TL_IRON,      15]],
        [[TYPE_LABEL, '', '兵舎　　　'], [TYPE_INPUT, TL_BALLACK,   15]],
        [[TYPE_LABEL, '', '鍛冶場　　'], [TYPE_INPUT, TL_W_SMITHY,  10]],
        [[TYPE_LABEL, '', '水車　　　'], [TYPE_INPUT, TL_W_WHEEL,   10]],
      ],
      [
        [[TYPE_LABEL, '', '畑　　　　'], [TYPE_INPUT, TL_FOOD,      15]],
        [[TYPE_LABEL, '', '弓兵舎　　'], [TYPE_INPUT, TL_B_BALLACK, 15]],
        [[TYPE_LABEL, '', '防具工場　'], [TYPE_INPUT, TL_A_SMITHY,  10]],
        [[TYPE_LABEL, '', '工場　　　'], [TYPE_INPUT, TL_FACTORY,   10]],
      ],
      [
        [[TYPE_LABEL, '', '倉庫　　　'], [TYPE_INPUT, TL_STORAGE,   20]],
        [[TYPE_LABEL, '', '厩舎　　　'], [TYPE_INPUT, TL_STABLE,    15]],
        [[TYPE_LABEL, '', '兵器工房　'], [TYPE_INPUT, TL_WEAPON,    15]],
      ],
    ],
    // 建設オプション
    'tab2-1': [
      [
        [[TYPE_CHECKBOX, CO_FOOD_BASE,   '糧村化（畑＋銅雀台）　　　']], [[TYPE_CHECKBOX, CO_STORAGE_BASE, '倉庫村化（畑x1＋銅雀台＋倉庫）']]
      ],
      [
        [[TYPE_CHECKBOX, CO_HAS_EMPTY,   '一定数の空き地を残す'], [TYPE_INPUT, TO_HAS_EMPTY, 1]]
      ],
    ],
    'tab2-2': [
      [
        [[TYPE_LABEL, '', '建設対象施設、施設数の設定']],
      ],
      [
        [[TYPE_CHECKBOX, CO_FOOD,      '畑　　　　'], [TYPE_INPUT, TO_FOOD,    1]],
        [[TYPE_CHECKBOX, CO_WOOD,      '伐採所　　'], [TYPE_INPUT, TO_WOOD,    1]],
        [[TYPE_CHECKBOX, CO_STONE,     '石切り場　'], [TYPE_INPUT, TO_STONE,   1]],
        [[TYPE_CHECKBOX, CO_IRON,      '製鉄所　　'], [TYPE_INPUT, TO_IRON,    1]],
      ],
      [
        [[TYPE_CHECKBOX, CO_STORAGE,   '倉庫　　　'], [TYPE_INPUT, TO_STORAGE, 1]],
        [[TYPE_CHECKBOX, CO_LODGE,     '宿舎　　　'], [TYPE_INPUT, TO_LODGE,   1]],
        [[TYPE_CHECKBOX, CO_L_LODGE,   '大宿舎　　'], [TYPE_INPUT, TO_L_LODGE, 1]],
      ],
      [
        [[TYPE_CHECKBOX, CO_PARADE,    '練兵所　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_SYMBOL,    '銅雀台　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_LABO,      '研究所　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_W_TOWER,   '見張り台　'], [TYPE_BLANK, '', '']],
      ],
      [
        [[TYPE_CHECKBOX, CO_BALLACK,   '兵舎　　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_B_BALLACK, '弓兵舎　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_STABLE,    '厩舎　　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_WEAPON,    '兵器工房　'], [TYPE_BLANK, '', '']],
      ],
      [
        [[TYPE_CHECKBOX, CO_W_SMITHY,  '鍛冶場　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_A_SMITHY,  '防具工場　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_TRAINING,  '訓練所　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_EXPEDITE,  '遠征訓練所'], [TYPE_BLANK, '', '']],
      ],
      [
        [[TYPE_CHECKBOX, CO_MARKET,    '市場　　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_FACTORY,   '工場　　　'], [TYPE_BLANK, '', '']],
        [[TYPE_CHECKBOX, CO_W_WHEEL,   '水車　　　'], [TYPE_BLANK, '', '']],
      ],
    ],
    // 内政スキルリスト
    'tab4': [
      [
        [[TYPE_LABEL, '', '一種資源増加']],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_F1, '食糧知識　　　　　'], [TYPE_CHECKBOX, CA_SKILL_W1, '伐採知識　　　　　'],
          [TYPE_CHECKBOX, CA_SKILL_S1, '石切知識　　　　　'], [TYPE_CHECKBOX, CA_SKILL_I1, '製鉄知識　　　　　'],
        ],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_F2, '食糧技術　　　　　'], [TYPE_CHECKBOX, CA_SKILL_W2, '伐採技術　　　　　'],
          [TYPE_CHECKBOX, CA_SKILL_S2, '石切技術　　　　　'], [TYPE_CHECKBOX, CA_SKILL_I2, '製鉄技術　　　　　'],
        ],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_R1, '豊潤祈祷　　　　　'], [TYPE_CHECKBOX, CA_SKILL_F3, '食糧革命　　　　　'],
        ],
      ],
      [
        [[TYPE_LABEL, '', '二種資源増加']],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_W1, '農林知識　　　　　'], [TYPE_CHECKBOX, CA_SKILL_W2, '加工知識　　　　　'],
          [TYPE_CHECKBOX, CA_SKILL_W3, '農林技術　　　　　'], [TYPE_CHECKBOX, CA_SKILL_W4, '加工技術　　　　　'],
        ],
      ],
      [
        [[TYPE_LABEL, '', '三種資源増加']],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_T1, '素材知識　　　　　'], [TYPE_CHECKBOX, CA_SKILL_T2, '恵風　　　　　　　'],
          [TYPE_CHECKBOX, CA_SKILL_T3, '富国　　　　　　　'], [TYPE_CHECKBOX, CA_SKILL_T4, '富国論　　　　　　'],
        ],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_T5, '才女の音律　　　　'], [TYPE_CHECKBOX, CA_SKILL_T6, '聡明叡智　　　　　'],
          [TYPE_CHECKBOX, CA_SKILL_T7, '優姫の敬愛　　　　'], [TYPE_CHECKBOX, CA_SKILL_T8, '孫家の恵み　　　　'],
        ],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_T9, '美玉華舞　　　　　'], [TYPE_CHECKBOX, CA_SKILL_TA, '苛政虎舞　　　　　'],
        ],
      ],
      [
        [[TYPE_LABEL, '', '四種資源増加']],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_Q1, '豊穣　　　　　　　'], [TYPE_CHECKBOX, CA_SKILL_Q2, '人選眼力　　　　　'],
          [TYPE_CHECKBOX, CA_SKILL_Q3, '富国強兵　　　　　']
        ],
      ],
      [
        [[TYPE_LABEL, '', '建設時間短縮']],
      ],
      [
        [
          [TYPE_CHECKBOX, CA_SKILL_C1, '呉の治世　　　　　'], [TYPE_CHECKBOX, CA_SKILL_C2, '王佐の才　　　　　'],
        ],
      ],
    ]
  };

  return {'tabs':tabSettings, 'contents':tables};
}

//------------------------------//
// 建設オプションと施設の対応表 //
//------------------------------//
function getConstructionOptions(constructions) {
  var options = {
    '拠点':       {'max':TL_BASE                                             },
    '畑':         {'max':TL_FOOD,      'create':CO_FOOD,    'num':TO_FOOD    },
    '伐採所':     {'max':TL_WOOD,      'create':CO_WOOD,    'num':TO_WOOD    },
    '石切り場':   {'max':TL_STONE,     'create':CO_STONE,   'num':TO_STONE   },
    '製鉄所':     {'max':TL_IRON,      'create':CO_IRON,    'num':TO_IRON    },
    '倉庫':       {'max':TL_STORAGE,   'create':CO_STORAGE, 'num':TO_STORAGE },
    '宿舎':       {'max':TL_LODGE,     'create':CO_LODGE,   'num':TO_LODGE   },
    '大宿舎':     {'max':TL_L_LODGE,   'create':CO_L_LODGE, 'num':TO_L_LODGE },
    '練兵所':     {'max':TL_PARADE,    'create':CO_PARADE                    },
    '銅雀台':     {'max':TL_SYMBOL,    'create':CO_SYMBOL                    },
    '研究所':     {'max':TL_LABO,      'create':CO_LABO                      },
    '見張り台':   {'max':TL_W_TOWER,   'create':CO_W_TOWER                   },
    '兵舎':       {'max':TL_BALLACK,   'create':CO_BALLACK                   },
    '弓兵舎':     {'max':TL_B_BALLACK, 'create':CO_B_BALLACK                 },
    '厩舎':       {'max':TL_STABLE,    'create':CO_STABLE                    },
    '兵器工房':   {'max':TL_WEAPON,    'create':CO_WEAPON                    },
    '鍛冶場':     {'max':TL_W_SMITHY,  'create':CO_W_SMITHY                  },
    '防具工場':   {'max':TL_A_SMITHY,  'create':CO_A_SMITHY                  },
    '訓練所':     {'max':TL_TRAINING,  'create':CO_TRAINING                  },
    '遠征訓練所': {'max':TL_EXPEDITE,  'create':CO_EXPEDITE                  },
    '市場':       {'max':TL_MARKET,    'create':CO_MARKET                    },
    '工場':       {'max':TL_FACTORY,   'create':CO_FACTORY                   },
    '水車':       {'max':TL_W_WHEEL,   'create':CO_W_WHEEL                   },
  };
  return options;
}

//---------------//
// css定義の追加 //
//---------------//
function addBuilderCss() {
  var css = "\
    /** 拠点一覧のcss定義 */ \
    div.villageWindow { \
      display:none; \
      background-color: #030; border: outset 2px white; \
      font-size: 12px; padding: 2px; \
      position: absolute; left: 5px; top: 10px; \
      align: center; width: 190px; height: 340px; z-index: 200; \
    } \
    div.villageheader { \
      margin-left: 2px; font-weight: bold; background-color: #030; color: yellow; font-size:14px; \
    } \
    div.villagelistheader { \
      margin-left: 2px; font-weight: bold; background-color: #030; color: yellow; font-size:14px; \
      position: relative; top:15px; \
    } \
    div.villagesubmenu { \
      margin-left: 2px; background-color: #030; color: white; font-size:12px; \
      position: relative; top:10px; left:10px; width: 150px !important; \
    } \
    table.villagelist { \
      border:outset 2px white; margin:6px; border-collapse:separate; border-spacing:4px 1px; \
      position: relative; top:10px; \
    } \
    table.villagelist tr { \
      color: white; \
    } \
    .villageWindow input { \
      position: relative; top: 2px; \
    } \
    .villageWindow label { \
      margin-left: 4px; \
      -moz-user-select: none; -webkit-user-select: none; user-select: none; \
    } \
    .villageWindow span.villagename { \
      margin-left: 4px; \
      -moz-user-select: none; -webkit-user-select: none; user-select: none; \
      text-decoration: underline; \
      cursor: pointer; \
    } \
    .villageWindow .current { \
      color: yellow; \
    } \
    .villageWindow .new { \
      color: cyan; text-decoration: underline; \
    } \
    .villageWindow .highlight { \
      color: cyan; \
    } \
    .villageWindow .unknown { \
      color: red; text-decoration: line-through; \
    } \
    .villageWindow .saveButton { \
      font-size: 12px; position: absolute; left: 2px; top: 318px; \
    } \
    .villageWindow .closeButton { \
      font-size: 12px; position: absolute; left: 40px; top: 318px; \
    } \
\
    /** 設定画面のcss定義 */ \
    div.builderWindow { \
      display:none; \
      background-color: #030; color: white; border: outset 2px white; \
      font-size: 12px; padding: 2px; \
      position: absolute; left: 205px; top: 10px; \
      align: center; width: 540px; height: 440px; z-index: 200; \
    } \
    .builderWindow .selected { \
      background-color: #040; color: yellow; font-weight:bold; border-bottom: #030 0px !important; \
    } \
    div.builderheader { \
      margin-left: 2px; font-weight: bold; background-color: #030; color: yellow; font-size:14px; \
    } \
    div.contentsheader { \
      margin-left: 2px; font-weight: bold; background-color: #040; color: yellow; font-size:14px; \
    } \
    ul.buildertabs { \
      display: box; display: -webkit-box; display: -moz-box; \
      position:relative; top:2px; margin: 0px; padding: 0px; background-color: #010; color: #ddd; \
    } \
    ul.buildertabs li { \
      list-style:none; border: outset 2px white; cursor: pointer; \
      margin:1px; padding-left: 4px; padding-right:4px; height:24px; \
      -moz-user-select: none; -webkit-user-select: none; user-select: none; \
    } \
    div.buildertabbody { \
      background-color: #040; border: outset 2px white; margin-left: 1px; \
      font-size: 12px; padding: 2px; position:relative; top:-2px; \
      width: 528px; height:360px; \
    } \
    table.contents { \
      border:outset 2px white; margin:6px; border-collapse:separate; border-spacing:4px 1px; \
      position: relative; top:0px; font-size:12px; font-weight: normal; \
    } \
    table.contents tr { \
      color: white; \
    } \
    .builderWindow input { \
      position: relative; top: 2px; margin-bottom: 2px; \
    } \
    .builderWindow label { \
      margin-left: 4px; \
      -moz-user-select: none; -webkit-user-select: none; user-select: none; \
    } \
    .builderWindow .rspace { \
      margin-right: 10px; \
    } \
    .builderWindow .lspace { \
      margin-left: 10px; \
    } \
    .builderWindow .hidden {\
      display:none; \
    } \
    .builderWindow .lbutton { \
      position:relative; left: 4px; top:-2px !important;\
    } \
    .builderWindow .lbutton2 { \
      position:absolute; top:280px; left:4px; \
    } \
    .builderWindow .float-right { \
      float:right; margin-right: 10px; \
    } \
    .builderWindow .info { \
      color: yellow; font-weight: bold; \
    } \
    .builderWindow .tableinfo { \
      color: white; font-weight: normal; \
    } \
    .builderWindow .builderbutton { \
      font-size: 12px; position: relative; left: 0px; top: 2px;\
    } \
    .builderWindow .customBox { \
      width: 250px; height: 250px; position: relative; top:0px; left:4px; font-size:12px; padding:2px; resize: none; float:left;\
      border: inset 2px white; color:white; background-color:#020; \
    } \
    .builderWindow .analyzeBox { \
      width: 220px; height: 226px; position: relative; top:-2px; left:8px; font-size:12px; padding:2px; resize: none; \
      border: inset 2px white; color:white; background-color:#020; \
    } \
    .builderWindow .analyzeButton { \
      position:relative; top:-2px; left:6px; \
    } \
\
    /** 建設シミュレーター画面のcss定義 */ \
    div.simulatorWindow { \
      display:none; \
      background-color: #040; color: white; border: outset 2px white; \
      font-size: 12px; padding: 2px; \
      position: absolute; left: 130px; top: 10px; \
      align: center; width: 615px; height: 440px; z-index: 210; \
    } \
    div.simulatorheader { \
      margin-left: 2px; font-weight: bold; background-color: #040; color: yellow; font-size:14px; \
    } \
    .simulatorWindow .center { \
      text-align: center; \
    } \
    .simulatorWindow .middle { \
      vertical-align: middle; \
    } \
    .simulatorWindow input { \
      position: relative; top: 2px;\
    } \
    .simulatorWindow .checkbox { \
      position: relative; top: 4px;\
    } \
    .simulatorWindow .label { \
      margin-left:4px; font-size:12px; font-weight:normal; color:white; position:relative; top:2px;\
    } \
    .simulatorWindow .inputbox { \
      margin-left:4px; font-size:12px; font-weight:normal; color:black; \
    } \
    table.village { \
      border:outset 2px white; margin:6px; border-collapse:separate; padding: 0px; \
      position: relative; top:0px; font-size:12px; font-weight: normal; \
    } \
    table.village tr td { \
      color: white; width:48px; height:48px; font-size:12px; font-weight:bold; border: outset 1px white; text-align:center; vertical-align:middle; \
    } \
    .simulatorWindow .closeButton { \
      font-size: 12px; position: absolute; left: 6px; top: 416px;\
    } \
    .simulatorWindow .refreshButton { \
      font-size: 12px; font-weight: normal;\
    } \
  ";
  GM_addStyle(css);
}

//----------------------------------------//
// 建設関連のリソース定数アクセスメソッド //
//----------------------------------------//
// 施設建設資源配列の取得(木、石、鉄、糧、所要秒数[運営バグ対策のため正確さは不要])
function getBuildResources(constructorName, level){
  var resources = {
    '伐採所':[
      {wood: 10, stone: 35, iron: 40, food: 15, time: 135},
      {wood: 25, stone: 88, iron: 100, food: 38, time: 250},
      {wood: 58, stone: 202, iron: 230, food: 86, time: 550},
      {wood: 173, stone: 604, iron: 690, food: 259, time: 1100},
      {wood: 431, stone: 1510, iron: 1725, food: 647, time: 2200},
      {wood: 1466, stone: 2847, iron: 3019, food: 1294, time: 4180},
      {wood: 2493, stone: 4839, iron: 5132, food: 2200, time: 7942},
      {wood: 3490, stone: 6775, iron: 7186, food: 3080, time: 14296},
      {wood: 4537, stone: 8807, iron: 9341, food: 4003, time: 24303},
      {wood: 5898, stone: 11450, iron: 12144, food: 5204, time: 38884},
      {wood: 8119, stone: 14434, iron: 15787, food: 6766, time: 58326},
      {wood: 11366, stone: 20207, iron: 22101, food: 9472, time: 81656},
      {wood: 17050, stone: 30311, iron: 33152, food: 14208, time: 106153},
      {wood: 25575, stone: 45467, iron: 49729, food: 21312, time: 127384},
      {wood: 38362, stone: 68199, iron: 74593, food: 31968, time: 140122}
    ],
    '石切り場':[
      {wood: 40, stone: 10, iron: 35, food: 15, time: 135},
      {wood: 100, stone: 25, iron: 88, food: 38, time: 250},
      {wood: 230, stone: 58, iron: 202, food: 86, time: 550},
      {wood: 690, stone: 173, iron: 604, food: 259, time: 1100},
      {wood: 1725, stone: 431, iron: 1510, food: 647, time: 2200},
      {wood: 3019, stone: 1466, iron: 2847, food: 1294, time: 4180},
      {wood: 5132, stone: 2493, iron: 4839, food: 2200, time: 7942},
      {wood: 7186, stone: 3490, iron: 6775, food: 3080, time: 14296},
      {wood: 9341, stone: 4537, iron: 8807, food: 4003, time: 24303},
      {wood: 12144, stone: 5898, iron: 11450, food: 5204, time: 38884},
      {wood: 15787, stone: 8119, iron: 14434, food: 6766, time: 58326},
      {wood: 22101, stone: 11366, iron: 20207, food: 9472, time: 81656},
      {wood: 33152, stone: 17050, iron: 30311, food: 14208, time: 106153},
      {wood: 49729, stone: 25575, iron: 45467, food: 21312, time: 127384},
      {wood: 74593, stone: 38362, iron: 68199, food: 31968, time: 140122}
    ],
    '製鉄所':[
      {wood: 35, stone: 40, iron: 10, food: 15, time: 135},
      {wood: 88, stone: 100, iron: 25, food: 38, time: 250},
      {wood: 202, stone: 230, iron: 58, food: 86, time: 550},
      {wood: 604, stone: 690, iron: 173, food: 259, time: 1100},
      {wood: 1510, stone: 1725, iron: 431, food: 647, time: 2200},
      {wood: 2847, stone: 3019, iron: 1466, food: 1294, time: 4180},
      {wood: 4839, stone: 5132, iron: 2493, food: 2200, time: 7942},
      {wood: 6775, stone: 7186, iron: 3490, food: 3080, time: 14296},
      {wood: 8807, stone: 9341, iron: 4537, food: 4003, time: 24303},
      {wood: 11450, stone: 12144, iron: 5898, food: 5204, time: 38884},
      {wood: 14434, stone: 15787, iron: 8119, food: 6766, time: 58326},
      {wood: 20207, stone: 22101, iron: 11366, food: 9472, time: 81656},
      {wood: 30311, stone: 33152, iron: 17050, food: 14208, time: 106153},
      {wood: 45467, stone: 49729, iron: 25575, food: 21312, time: 127384},
      {wood: 68199, stone: 74593, iron: 38362, food: 31968, time: 140122}
    ],
    '畑':[
      {wood: 35, stone: 35, iron: 30, food: 0, time: 120},
      {wood: 88, stone: 88, iron: 75, food: 0, time: 216},
      {wood: 202, stone: 202, iron: 173, food: 0, time: 389},
      {wood: 604, stone: 604, iron: 518, food: 0, time: 661},
      {wood: 1510, stone: 1510, iron: 1294, food: 0, time: 1124},
      {wood: 3019, stone: 3019, iron: 2588, food: 0, time: 1910},
      {wood: 5132, stone: 5132, iron: 4399, food: 0, time: 3247},
      {wood: 7186, stone: 7186, iron: 6159, food: 0, time: 5520},
      {wood: 9341, stone: 9341, iron: 8007, food: 0, time: 8833},
      {wood: 12144, stone: 12144, iron: 10409, food: 0, time: 13249},
      {wood: 15787, stone: 15787, iron: 13532, food: 0, time: 19873},
      {wood: 22101, stone: 22101, iron: 18944, food: 0, time: 27823},
      {wood: 33152, stone: 33152, iron: 28416, food: 0, time: 36170},
      {wood: 49729, stone: 49729, iron: 42625, food: 0, time: 45212},
      {wood: 74593, stone: 74593, iron: 63937, food: 0, time: 54225}
    ],
    '練兵所':[
      {wood: 112, stone: 107, iron: 107, food: 122, time: 192},
      {wood: 224, stone: 214, iron: 214, food: 244, time: 384},
      {wood: 448, stone: 428, iron: 428, food: 488, time: 768},
      {wood: 759, stone: 725, iron: 725, food: 826, time: 1536},
      {wood: 1214, stone: 1160, iron: 1160, food: 1322, time: 3072},
      {wood: 2209, stone: 2110, iron: 2110, food: 2406, time: 4608},
      {wood: 3331, stone: 3182, iron: 3182, food: 3627, time: 6922},
      {wood: 4958, stone: 4736, iron: 4736, food: 5400, time: 10368},
      {wood: 8091, stone: 7729, iron: 7729, food: 8813, time: 14515},
      {wood: 11130, stone: 10632, iron: 10632, food: 12122, time: 20312}
    ],
    '兵舎':[
      {wood: 72, stone: 360, iron: 72, food: 216, time: 216},
      {wood: 144, stone: 720, iron: 144, food: 432, time: 432},
      {wood: 228, stone: 1440, iron: 228, food: 864, time: 864},
      {wood: 648, stone: 1728, iron: 648, food: 1296, time: 1728},
      {wood: 972, stone: 2592, iron: 972, food: 1944, time: 3456},
      {wood: 1409, stone: 3758, iron: 1409, food: 2819, time: 5184},
      {wood: 2725, stone: 4088, iron: 2725, food: 4088, time: 7776},
      {wood: 6744, stone: 9810, iron: 5518, food: 2453, time: 10886},
      {wood: 12140, stone: 17658, iron: 9933, food: 4415, time: 15241},
      {wood: 21852, stone: 31784, iron: 17879, food: 7946, time: 19814},
      {wood: 39333, stone: 57212, iron: 32182, food: 14303, time: 25757},
      {wood: 70800, stone: 96545, iron: 64364, food: 25745, time: 33485},
      {wood: 127440, stone: 173781, iron: 115854, food: 43642, time: 43529},
      {wood: 254879, stone: 324392, iron: 254879, food: 92683, time: 56588},
      {wood: 509759, stone: 648784, iron: 509759, food: 185367, time: 73615}
    ],
    '弓兵舎':[
      {wood: 360, stone: 72, iron: 72, food: 216, time: 216},
      {wood: 720, stone: 144, iron: 144, food: 432, time: 432},
      {wood: 1440, stone: 228, iron: 228, food: 864, time: 864},
      {wood: 1728, stone: 648, iron: 648, food: 1296, time: 1728},
      {wood: 2592, stone: 972, iron: 972, food: 1944, time: 3456},
      {wood: 3758, stone: 1409, iron: 1409, food: 2819, time: 5184},
      {wood: 5450, stone: 2044, iron: 2044, food: 4087, time: 7776},
      {wood: 9810, stone: 6131, iron: 6131, food: 2453, time: 10886},
      {wood: 17658, stone: 12140, iron: 9933, food: 4415, time: 15241},
      {wood: 31784, stone: 21852, iron: 17879, food: 7946, time: 19814},
      {wood: 57212, stone: 39333, iron: 32182, food: 14303, time: 25757},
      {wood: 96545, stone: 70800, iron: 64364, food: 25745, time: 33485},
      {wood: 173781, stone: 127440, iron: 115854, food: 46342, time: 42529},
      {wood: 324392, stone: 254879, iron: 254879, food: 92683, time: 56588},
      {wood: 648784, stone: 509759, iron: 509759, food: 185367, time: 73615}
    ],
    '厩舎':[
      {wood: 72, stone: 72, iron: 360, food: 216, time: 216},
      {wood: 144, stone: 144, iron: 720, food: 432, time: 432},
      {wood: 228, stone: 228, iron: 1440, food: 864, time: 864},
      {wood: 648, stone: 648, iron: 1728, food: 1296, time: 1728},
      {wood: 972, stone: 972, iron: 2592, food: 1944, time: 3456},
      {wood: 1409, stone: 1409, iron: 3758, food: 2891, time: 5184},
      {wood: 2044, stone: 2044, iron: 5450, food: 4087, time: 7776},
      {wood: 5518, stone: 6744, iron: 9810, food: 2453, time: 10886},
      {wood: 9933, stone: 12140, iron: 17658, food: 4415, time: 15241},
      {wood: 17879, stone: 21852, iron: 31784, food: 7946, time: 19814},
      {wood: 32182, stone: 39333, iron: 57212, food: 14303, time: 25757},
      {wood: 64364, stone: 70800, iron: 96545, food: 25745, time: 33485},
      {wood: 115854, stone: 127440, iron: 173781, food: 46342, time: 42529},
      {wood: 254879, stone: 254879, iron: 324392, food: 92683, time: 56588},
      {wood: 509759, stone: 509759, iron: 648784, food: 185367, time: 73615}
    ],
    '兵器工房':[
      {wood: 216, stone: 216, iron: 216, food: 72, time: 216},
      {wood: 432, stone: 432, iron: 432, food: 144, time: 432},
      {wood: 864, stone: 864, iron: 864, food: 288, time: 864},
      {wood: 1224, stone: 1224, iron: 1224, food: 648, time: 1728},
      {wood: 1836, stone: 1836, iron: 1836, food: 972, time: 3456},
      {wood: 2662, stone: 2662, iron: 2662, food: 1409, time: 5184},
      {wood: 3860, stone: 3860, iron: 3860, food: 2044, time: 7776},
      {wood: 7357, stone: 7357, iron: 7357, food: 2452, time: 10886},
      {wood: 13242, stone: 13242, iron: 13242, food: 4414, time: 15241},
      {wood: 23836, stone: 23836, iron: 23836, food: 7945, time: 19814},
      {wood: 42905, stone: 42905, iron: 42905, food: 14302, time: 25757},
      {wood: 77229, stone: 77229, iron: 77229, food: 25743, time: 33485},
      {wood: 139013, stone: 139013, iron: 139013, food: 46338, time: 42529},
      {wood: 278026, stone: 278026, iron: 278026, food: 92675, time: 56588},
      {wood: 556051, stone: 556051, iron: 556051, food: 185350, time: 73615}
    ],
    '宿舎':[
      {wood: 35, stone: 20, iron: 35, food: 80, time: 72},
      {wood: 53, stone: 30, iron: 53, food: 120, time: 144},
      {wood: 89, stone: 51, iron: 89, food: 204, time: 274},
      {wood: 147, stone: 84, iron: 147, food: 337, time: 492},
      {wood: 228, stone: 130, iron: 228, food: 522, time: 837},
      {wood: 336, stone: 192, iron: 336, food: 767, time: 1339},
      {wood: 476, stone: 272, iron: 476, food: 1089, time: 2010},
      {wood: 653, stone: 373, iron: 653, food: 1492, time: 2813},
      {wood: 868, stone: 496, iron: 868, food: 1984, time: 3657},
      {wood: 1129, stone: 645, iron: 1129, food: 2580, time: 4388},
      {wood: 2032, stone: 1161, iron: 2032, food: 4644, time: 5266},
      {wood: 3658, stone: 2090, iron: 3658, food: 4644, time: 6319},
      {wood: 6951, stone: 3971, iron: 6950, food: 15882, time: 7583},
      {wood: 13205, stone: 7544, iron: 13205, food: 30177, time: 9100},
      {wood: 25090, stone: 14334, iron: 25090, food: 57336, time: 10920}
    ],
    '大宿舎':[
      {wood: 200, stone: 114, iron: 200, food: 438, time: 216},
      {wood: 320, stone: 183, iron: 320, food: 701, time: 432},
      {wood: 512, stone: 293, iron: 512, food: 1121, time: 821},
      {wood: 768, stone: 439, iron: 768, food: 1682, time: 1477},
      {wood: 1152, stone: 658, iron: 1152, food: 2523, time: 2511},
      {wood: 1728, stone: 987, iron: 1728, food: 3784, time: 4018},
      {wood: 2419, stone: 1382, iron: 2419, food: 5298, time: 6029},
      {wood: 3387, stone: 1935, iron: 3387, food: 7418, time: 8440},
      {wood: 4741, stone: 2709, iron: 4741, food: 10385, time: 10970},
      {wood: 6637, stone: 3793, iron: 6637, food: 14538, time: 13165},
      {wood: 8628, stone: 4930, iron: 8628, food: 18900, time: 15798},
      {wood: 11217, stone: 6409, iron: 11217, food: 24570, time: 18957},
      {wood: 14582, stone: 8332, iron: 14582, food: 31941, time: 22750},
      {wood: 18956, stone: 11735, iron: 18956, food: 40620, time: 27300},
      {wood: 25817, stone: 16429, iron: 25817, food: 49286, time: 35999},
      {wood: 32271, stone: 22003, iron: 32271, food: 60141, time: 39311},
      {wood: 42172, stone: 29337, iron: 42172, food: 69675, time: 47174},
      {wood: 52715, stone: 38963, iron: 52715, food: 84803, time: 56607},
      {wood: 66009, stone: 49506, iron: 66009, food: 93512, time: 67929},
      {wood: 79211, stone: 62708, iron: 79211, food: 108914, time: 81515}
    ],
    '訓練所':[
      {wood: 1500, stone: 1600, iron: 2500, food: 3300, time: 900},
      {wood: 2100, stone: 2240, iron: 3500, food: 3300, time: 1440},
      {wood: 2940, stone: 3136, iron: 4900, food: 6468, time: 2304},
      {wood: 6629, stone: 7326, iron: 13955, food: 6978, time: 3686},
      {wood: 13257, stone: 14653, iron: 27910, food: 13955, time: 5898},
      {wood: 32097, stone: 37679, iron: 55821, food: 13955, time: 9437},
      {wood: 64194, stone: 75358, iron: 111642, food: 27910, time: 15099},
      {wood: 128388, stone: 150716, iron: 223283, food: 55821, time: 24159},
      {wood: 256776, stone: 301432, iron: 446566, food: 111642, time: 38655},
      {wood: 513551, stone: 602865, iron: 893133, food: 223283, time: 61848}
    ],
    '遠征訓練所':[
      {wood: 2884, stone: 4486, iron: 5977, food: 2723, time: 1500},
      {wood: 4614, stone: 7177, iron: 9484, food: 4357, time: 2250},
      {wood: 7382, stone: 11483, iron: 15174, food: 6972, time: 3375},
      {wood: 11811, stone: 18373, iron: 24279, food: 11155, time: 4725},
      {wood: 18898, stone: 29397, iron: 38846, food: 17848, time: 6615},
      {wood: 28347, stone: 44096, iron: 58269, food: 26772, time: 9261},
      {wood: 42521, stone: 66143, iron: 87404, food: 40158, time: 12039},
      {wood: 63781, stone: 99215, iron: 131105, food: 60238, time: 15651},
      {wood: 89294, stone: 138901, iron: 183548, food: 84333, time: 20346},
      {wood: 125011, stone: 194461, iron: 256967, food: 118066, time: 26450},
      {wood: 175015, stone: 272246, iron: 359754, food: 165292, time: 31740},
      {wood: 227520, stone: 353920, iron: 467680, food: 214880, time: 38088},
      {wood: 295776, stone: 460096, iron: 607984, food: 279344, time: 45706},
      {wood: 384509, stone: 598125, iron: 790379, food: 363147, time: 54847},
      {wood: 512678, stone: 692116, iron: 897187, food: 461410, time: 60332},
      {wood: 645974, stone: 830539, iron: 1045863, food: 553692, time: 66365},
      {wood: 812082, stone: 959734, iron: 1218123, food: 701344, time: 73002},
      {wood: 1018794, stone: 1151680, iron: 1417453, food: 841613, time: 80302},
      {wood: 1275708, stone: 1382016, iron: 1647789, food: 1009935, time: 88332},
      {wood: 1594635, stone: 1658420, iron: 1913561, food: 1211922, time: 97166}
    ],
    '鍛冶場':[
      {wood: 150, stone: 200, iron: 340, food: 170, time: 255},
      {wood: 400, stone: 300, iron: 680, food: 340, time: 765},
      {wood: 780, stone: 585, iron: 1326, food: 663, time: 2295},
      {wood: 1482, stone: 1112, iron: 2519, food: 1260, time: 4590},
      {wood: 2742, stone: 2056, iron: 4661, food: 2330, time: 9180},
      {wood: 4935, stone: 3701, iron: 8390, food: 4195, time: 13770},
      {wood: 8636, stone: 6477, iron: 14682, food: 7341, time: 20655},
      {wood: 17640, stone: 14112, iron: 28223, food: 10584, time: 24786},
      {wood: 31566, stone: 25253, iron: 50506, food: 18940, time: 29743},
      {wood: 50506, stone: 40404, iron: 80809, food: 30303, time: 35692}
    ],
    '防具工場':[
      {wood: 150, stone: 200, iron: 340, food: 170, time: 255},
      {wood: 300, stone: 400, iron: 680, food: 340, time: 765},
      {wood: 585, stone: 780, iron: 1326, food: 663, time: 2295},
      {wood: 1112, stone: 1482, iron: 2519, food: 1260, time: 4590},
      {wood: 2056, stone: 2742, iron: 4661, food: 2330, time: 9180},
      {wood: 3701, stone: 4935, iron: 8390, food: 4195, time: 13770},
      {wood: 6477, stone: 8636, iron: 14682, food: 7341, time: 20655},
      {wood: 14112, stone: 17640, iron: 28223, food: 10584, time: 24786},
      {wood: 25253, stone: 31566, iron: 50506, food: 18940, time: 29743},
      {wood: 40404, stone: 50506, iron: 80809, food: 30303, time: 35692}
    ],
    '見張り台':[
      {wood: 600, stone: 840, iron: 600, food: 360, time: 900},
      {wood: 960, stone: 1344, iron: 960, food: 576, time: 1350},
      {wood: 1536, stone: 2150, iron: 1536, food: 922, time: 2025},
      {wood: 2458, stone: 3441, iron: 2458, food: 1475, time: 2835},
      {wood: 3932, stone: 5505, iron: 3932, food: 2359, time: 3969},
      {wood: 6291, stone: 8808, iron: 6291, food: 3775, time: 5557},
      {wood: 9437, stone: 13212, iron: 9437, food: 5662, time: 7224},
      {wood: 14156, stone: 19818, iron: 14156, food: 8493, time: 9391},
      {wood: 21233, stone: 29727, iron: 21233, food: 12740, time: 12208},
      {wood: 31850, stone: 44590, iron: 31850, food: 19110, time: 15870},
      {wood: 44590, stone: 62426, iron: 44590, food: 26754, time: 19044},
      {wood: 62426, stone: 87396, iron: 62426, food: 37456, time: 22853},
      {wood: 87397, stone: 122355, iron: 87397, food: 52438, time: 27424},
      {wood: 122355, stone: 171297, iron: 122355, food: 73413, time: 32908},
      {wood: 159062, stone: 222686, iron: 159062, food: 95437, time: 36199},
      {wood: 206780, stone: 289492, iron: 206780, food: 124068, time: 39819},
      {wood: 268814, stone: 376340, iron: 268814, food: 161288, time: 43801},
      {wood: 349458, stone: 489242, iron: 349458, food: 209675, time: 48181},
      {wood: 419350, stone: 587090, iron: 419350, food: 251610, time: 52999},
      {wood: 503220, stone: 704508, iron: 503220, food: 301932, time: 58299}
    ],
    '倉庫':[
      {wood: 83, stone: 141, iron: 83, food: 63, time: 20},
      {wood: 167, stone: 281, iron: 167, food: 126, time: 412},
      {wood: 300, stone: 506, iron: 300, food: 226, time: 618},
      {wood: 479, stone: 810, iron: 479, food: 362, time: 1138},
      {wood: 671, stone: 1134, iron: 671, food: 507, time: 1706},
      {wood: 1044, stone: 1253, iron: 1044, food: 835, time: 2559},
      {wood: 1462, stone: 1754, iron: 1462, food: 1169, time: 3839},
      {wood: 1973, stone: 2368, iron: 1973, food: 1578, time: 5162},
      {wood: 2664, stone: 3196, iron: 2664, food: 2131, time: 6476},
      {wood: 3596, stone: 4315, iron: 3596, food: 2877, time: 8084},
      {wood: 4854, stone: 5825, iron: 4854, food: 3883, time: 9700},
      {wood: 6311, stone: 7573, iron: 6311, food: 5048, time: 11640},
      {wood: 8204, stone: 9845, iron: 8204, food: 6563, time: 13968},
      {wood: 10255, stone: 12306, iron: 10255, food: 8204, time: 16761},
      {wood: 12819, stone: 15382, iron: 12819, food: 10255, time: 20114},
      {wood: 15382, stone: 18459, iron: 15382, food: 12306, time: 23208},
      {wood: 18459, stone: 22151, iron: 18459, food: 14767, time: 27850},
      {wood: 21228, stone: 21228, iron: 25473, food: 16982, time: 33420},
      {wood: 24412, stone: 29294, iron: 24412, food: 19529, time: 39034},
      {wood: 28074, stone: 33688, iron: 28074, food: 22459, time: 46841}
    ],
    '研究所':[
      {wood: 275, stone: 110, iron: 110, food: 55, time: 216},
      {wood: 413, stone: 165, iron: 165, food: 83, time: 432},
      {wood: 619, stone: 248, iron: 248, food: 124, time: 864},
      {wood: 1486, stone: 836, iron: 836, food: 557, time: 1728},
      {wood: 2228, stone: 1253, iron: 1253, food: 836, time: 3456},
      {wood: 7521, stone: 6267, iron: 6267, food: 5015, time: 5184},
      {wood: 13538, stone: 11282, iron: 11282, food: 9025, time: 7776},
      {wood: 21436, stone: 17862, iron: 17862, food: 14290, time: 10886},
      {wood: 44675, stone: 37228, iron: 37228, food: 29784, time: 15240},
      {wood: 87725, stone: 73104, iron: 73104, food: 58483, time: 19813}
    ],
    '市場':[
      {wood: 100, stone: 100, iron: 50, food: 50, time: 171},
      {wood: 334, stone: 334, iron: 191, food: 191, time: 432},
      {wood: 1035, stone: 1035, iron: 592, food: 592, time: 864},
      {wood: 2795, stone: 2795, iron: 1600, food: 1600, time: 1728},
      {wood: 6328, stone: 6328, iron: 4218, food: 4218, time: 3456},
      {wood: 13288, stone: 13288, iron: 8859, food: 8859, time: 5184},
      {wood: 25248, stone: 25248, iron: 16832, food: 16832, time: 7776},
      {wood: 42921, stone: 42921, iron: 28614, food: 28614, time: 11664},
      {wood: 64381, stone: 64381, iron: 42921, food: 42921, time: 16330},
      {wood: 90134, stone: 90134, iron: 60089, food: 60089, time: 21229}
    ],
    '水車':[
      {wood: 2940, stone: 980, iron: 980, food: 4900, time: 2700},
      {wood: 4704, stone: 1568, iron: 1568, food: 7840, time: 4050},
      {wood: 7526, stone: 2509, iron: 2509, food: 12544, time: 6075},
      {wood: 10537, stone: 5268, iron: 5268, food: 14049, time: 9112},
      {wood: 14751, stone: 7376, iron: 7376, food: 19668, time: 13669},
      {wood: 20652, stone: 13768, iron: 13768, food: 20652, time: 20503},
      {wood: 28913, stone: 19275, iron: 19275, food: 28913, time: 30755},
      {wood: 37587, stone: 25058, iron: 25058, food: 37587, time: 46132},
      {wood: 48863, stone: 32576, iron: 32576, food: 48863, time: 69198},
      {wood: 63523, stone: 42348, iron: 42348, food: 63523, time: 103797}
    ],
    '工場':[
      {wood: 780, stone: 1560, iron: 1560, food: 3900, time: 2430},
      {wood: 1248, stone: 2496, iron: 2496, food: 6240, time: 3645},
      {wood: 1997, stone: 3994, iron: 3994, food: 9984, time: 5468},
      {wood: 4193, stone: 6290, iron: 6290, food: 11182, time: 8201},
      {wood: 5871, stone: 8806, iron: 8806, food: 15655, time: 12302},
      {wood: 10958, stone: 13698, iron: 13698, food: 16437, time: 18453},
      {wood: 15342, stone: 19177, iron: 19177, food: 23013, time: 27680},
      {wood: 19944, stone: 24930, iron: 24930, food: 29916, time: 41519},
      {wood: 25928, stone: 32410, iron: 32410, food: 38891, time: 62278},
      {wood: 33706, stone: 42132, iron: 42132, food: 50559, time: 93417}
    ],
    '銅雀台':[
      {wood: 700, stone: 3500, iron: 2100, food: 700, time: 3240},
      {wood: 1120, stone: 5600, iron: 3360, food: 1120, time: 4860},
      {wood: 1792, stone: 8960, iron: 5376, food: 1792, time: 7290},
      {wood: 3763, stone: 10035, iron: 7526, food: 3763, time: 10935},
      {wood: 5263, stone: 14049, iron: 10537, food: 5268, time: 16403},
      {wood: 9834, stone: 14752, iron: 14752, food: 9834, time: 24603},
      {wood: 13768, stone: 20652, iron: 20652, food: 13768, time: 36905},
      {wood: 17899, stone: 26848, iron: 26848, food: 17899, time: 55358},
      {wood: 23268, stone: 34902, iron: 34902, food: 23268, time: 83038},
      {wood: 30249, stone: 45373, iron: 45373, food: 30249, time: 124556}
    ],
    '城':[
      {wood: 0, stone: 0, iron: 0, food: 0, time: 0},
      {wood: 1404, stone: 546, iron: 390, food: 780, time: 0},
      {wood: 2570, stone: 1000, iron: 714, food: 1428, time: 0},
      {wood: 4161, stone: 2081, iron: 2081, food: 2081, time: 0},
      {wood: 7102, stone: 3552, iron: 3552, food: 3552, time: 0},
      {wood: 9056, stone: 9056, iron: 6037, food: 6037, time: 0},
      {wood: 14384, stone: 14384, iron: 9589, food: 9589, time: 0},
      {wood: 22773, stone: 22773, iron: 15183, food: 15183, time: 0},
      {wood: 33562, stone: 33562, iron: 22374, food: 22374, time: 0},
      {wood: 44402, stone: 57559, iron: 32890, food: 29602, time: 0},
      {wood: 65122, stone: 84418, iron: 48239, food: 43415, time: 0},
      {wood: 95317, stone: 123558, iron: 70605, food: 63544, time: 0},
      {wood: 113458, stone: 154716, iron: 154716, food: 92830, time: 0},
      {wood: 150418, stone: 150418, iron: 315878, food: 135375, time: 0},
      {wood: 219008, stone: 219008, iron: 492770, food: 164258, time: 0},
      {wood: 294820, stone: 294820, iron: 663345, food: 221115, time: 0},
      {wood: 488220, stone: 488220, iron: 827854, food: 318406, time: 0},
      {wood: 839130, stone: 839130, iron: 915414, food: 457707, time: 0},
      {wood: 1307581, stone: 1307581, iron: 1354280, food: 700491, time: 0},
      {wood: 1901938, stone: 1901938, iron: 1969864, food: 1018896, time: 0}
    ],
    '砦':[
      {wood: 104, stone: 400, iron: 136, food: 160, time: 0},
      {wood: 243, stone: 936, iron: 319, food: 374, time: 1800},
      {wood: 438, stone: 1685, iron: 573, food: 673, time: 2700},
      {wood: 1110, stone: 2467, iron: 1357, food: 1233, time: 4050},
      {wood: 1887, stone: 4194, iron: 2307, food: 2097, time: 6075},
      {wood: 3236, stone: 7191, iron: 3954, food: 3596, time: 9113},
      {wood: 5177, stone: 11505, iron: 6327, food: 5753, time: 13669},
      {wood: 10430, stone: 18776, iron: 13560, food: 9387, time: 20503},
      {wood: 18839, stone: 33912, iron: 24492, food: 16956, time: 30755},
      {wood: 33914, stone: 61043, iron: 44087, food: 30523, time: 46132},
      {wood: 66939, stone: 106495, iron: 85196, food: 45640, time: 55358},
      {wood: 119786, stone: 190570, iron: 152456, food: 81672, time: 66430},
      {wood: 213820, stone: 340166, iron: 272133, food: 145786, time: 79716},
      {wood: 423566, stone: 505021, iron: 456148, food: 244365, time: 95659},
      {wood: 708513, stone: 844765, iron: 763014, food: 408756, time: 114791}
    ],
    '村':[
      {wood: 400, stone: 136, iron: 104, food: 160, time: 0},
      {wood: 936, stone: 319, iron: 243, food: 374, time: 1800},
      {wood: 1685, stone: 573, iron: 438, food: 673, time: 2700},
      {wood: 2467, stone: 1357, iron: 1110, food: 1233, time: 4050},
      {wood: 4194, stone: 2307, iron: 1887, food: 2097, time: 6075},
      {wood: 7191, stone: 3954, iron: 3236, food: 3596, time: 9113},
      {wood: 11505, stone: 6327, iron: 5177, food: 5753, time: 13669},
      {wood: 18776, stone: 13560, iron: 10430, food: 9387, time: 20503},
      {wood: 33912, stone: 24492, iron: 18839, food: 16956, time: 30755},
      {wood: 61043, stone: 44087, iron: 33914, food: 30523, time: 46132},
      {wood: 106495, stone: 85196, iron: 66939, food: 45640, time: 55358},
      {wood: 190570, stone: 152456, iron: 119786, food: 81672, time: 66430},
      {wood: 340166, stone: 272133, iron: 213820, food: 145786, time: 79716},
      {wood: 505021, stone: 456148, iron: 423566, food: 244365, time: 95659},
      {wood: 844765, stone: 763014, iron: 708513, food: 408756, time: 114791}
    ]
  };

  if (typeof resources[constructorName][level] == 'undefined') {
    return null;
  }

  return resources[constructorName][level];
}

//------------------------//
// 各施設の建設条件を取得 //
//------------------------//
function getConstructionRules(){
  // 右辺には、[必要施設, 必須レベル]の配列を必要数定義
  // (ビルダーの処理評価順を兼ねているため、建設難易度の低い順に並べること)
  var rules = {
    '畑':         [],
    '伐採所':     [{con:'畑',       lv: 1}, {con:'森林',     lv: 0}],
    '石切り場':   [{con:'伐採所',   lv: 1, check:true}, {con:'岩山',     lv: 0}],  // 石切り場と製鉄所は、他施設に必須施設があればOKのため、
    '製鉄所':     [{con:'石切り場', lv: 1, check:true}, {con:'鉄鉱山',   lv: 0}],  // シミュレーション以外では建設チェックする
    '倉庫':       [],
    '宿舎':       [{con:'練兵所',   lv: 1}],
    '練兵所':     [{con:'倉庫',     lv: 1}],
    '鍛冶場':     [{con:'練兵所',   lv: 3}],
    '防具工場':   [{con:'練兵所',   lv: 3}, {con:'宿舎',     lv: 1}],
    '研究所':     [{con:'伐採所',   lv: 3}, {con:'石切り場', lv: 2}],
    '市場':       [{con:'防具工場', lv: 2}],
    '銅雀台':     [{con:'畑',       lv: 5}],
    '兵舎':       [{con:'宿舎',     lv: 3}],
    '弓兵舎':     [{con:'防具工場', lv: 1}, {con:'宿舎',     lv: 3}],
    '厩舎':       [{con:'鍛冶場',   lv: 1}, {con:'宿舎',     lv: 5}],
    '兵器工房':   [{con:'防具工場', lv: 3}, {con:'鍛冶場',   lv: 3}],
    '見張り台':   [{con:'防具工場', lv: 7}],
    '訓練所':     [{con:'銅雀台',   lv: 7}, {con:'鍛冶場',   lv: 5}],
    '大宿舎':     [{con:'宿舎',     lv:15}, {con:'見張り台', lv: 8}],
    '遠征訓練所': [{con:'訓練所',   lv: 5}, {con:'大宿舎',   lv: 8}],
    '水車':       [{con:'市場',     lv: 8}, {con:'倉庫',     lv:10}, {con:'練兵所', lv: 5}],
    '工場':       [{con:'市場',     lv:10}, {con:'兵器工房', lv: 5}],
  }
  return rules;
}

//----------------------//
// アイコン→施設名変換 //
//----------------------//
function convertConstructionIdToName(iconId){
  var icons = {
    209:'伐採所',  211:'石切り場',  213:'製鉄所',  215:'畑',      216:'銅雀台',  217:'市場',
    218:'水車',    219:'工場',    229:'訓練所',  230:'研究所',    231:'防具工場',  232:'鍛冶場',
    233:'倉庫',    234:'練兵所',  235:'兵舎',    236:'弓兵舎',    237:'厩舎',    241:'兵器工房',
    242:'宿舎',    243:'見張り台',  244:'大宿舎',  246:'遠征訓練所',  101:'森林',    102:'岩山',
    103:'鉄鉱山',  104:'穀物',    106:'荒地',    205:'城',      220:'村',    222:'砦'
  };
  if(typeof icons[iconId] == 'undefined'){
    return null;
  }
  return icons[iconId];
}

//----------------//
// 施設番号対応表 //
//----------------//
function getConstrutionNumber() {
  // 建設番号はアイコンチップ番号と同じ
  var numbers = {
    '伐採所':209, '石切り場':211, '製鉄所':213, '畑':215,        '銅雀台':216,   '市場':217,
    '水車':218,   '工場':219,     '訓練所':229, '研究所':230,    '防具工場':231, '鍛冶場':232,
    '倉庫':233,   '練兵所':234,   '兵舎':235,   '弓兵舎':236,    '厩舎':237,     '兵器工房':241,
    '宿舎':242,   '見張り台':243, '大宿舎':244, '遠征訓練所':246,
    '城':205,     '村':220,       '砦':222
  };
  return numbers;
}

//------------------//
// 短縮施設名対応表 //
//------------------//
function getShortName(construction) {
  var shortNames = {
    '伐採所':'伐', '石切り場':'石', '製鉄所':'製', '畑':'畑',         '銅雀台':'銅',   '市場':'市',
    '水車':'水',   '工場':'工',     '訓練所':'訓', '研究所':'研',     '防具工場':'防', '鍛冶場':'鍛',
    '倉庫':'倉',   '練兵所':'練',   '兵舎':'兵',   '弓兵舎':'弓',     '厩舎':'厩',     '兵器工房':'器',
    '宿舎':'宿',   '見張り台':'見', '大宿舎':'大', '遠征訓練所':'遠', '森林':'森',     '岩山':'岩',
    '鉄鉱山':'鉄', '穀物':'穀',     '荒地':'荒',   '空き地':'　',     '城':'城',       '砦':'砦',       '村':'村'
  };
  return shortNames[construction];
}

//--------------------------//
// 施設別レベルアップ上限表 //
//--------------------------//
function getLevelupLimit() {
  var levelupLimits = {
    '伐採所':15, '石切り場':15, '製鉄所':15, '畑':15,     '銅雀台':10,   '市場':10,
    '水車':10,   '工場':10,     '訓練所':10, '研究所':10, '防具工場':10, '鍛冶場':10,
    '倉庫':20,   '練兵所':10,   '兵舎':15,   '弓兵舎':15, '厩舎':15,     '兵器工房':15,
    '宿舎':15,   '見張り台':20, '大宿舎':20, '遠征訓練所':20,
    '城':20,     '砦':15,       '村':15
  };
  return levelupLimits;
}

//----------------------//
// 施設別複数建設可能表 //
//----------------------//
function getMultipleBuild() {
  var multipleMap = {
    '伐採所':true, '石切り場':true,  '製鉄所':true,  '畑':true,         '銅雀台':false,   '市場':false,
    '水車':false,  '工場':false,     '訓練所':false, '研究所':false,    '防具工場':false, '鍛冶場':false,
    '倉庫':true,   '練兵所':false,   '兵舎':false,   '弓兵舎':false,    '厩舎':false,     '兵器工房':false,
    '宿舎':true,   '見張り台':false, '大宿舎':true,  '遠征訓練所':false,
    '城':false,    '砦':false,       '村':false
  };
  return multipleMap;
}

//----------------------//
// Greasemonkey Wrapper //
//----------------------//
function initGMWrapper() {
  // @copyright    2009, James Campos
  // @license    cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
  if ((typeof GM_getValue == 'undefined') || (GM_getValue('a', 'b') == undefined)) {
    GM_addStyle = function (css) {
      var style = document.createElement('style');
      style.textContent = css;
      document.getElementsByTagName('head')[0].appendChild(style);
    };
    GM_deleteValue = function (name) {
      sessionStorage.removeItem(name);
      localStorage.removeItem(name);
    };
    GM_getValue = function (name, defaultValue) {
      var value;
      value = sessionStorage.getItem(name);
      if (!value) {
        value = localStorage.getItem(name);
        if (!value) {
          return defaultValue;
        }
      }
      var type = value[0];
      value = value.substring(1);
      switch (type) {
      case 'b':
        return value == 'true';
      case 'n':
        return Number(value);
      default:
        return value;
      }
    };
    GM_log = function (message) {
      if (window.opera) {
        opera.postError(message);
        return;
      }
      console.log(message);
    };
    GM_registerMenuCommand = function (name, funk) {
      //todo
    };
    GM_setValue = function (name, value) {
      value = (typeof value)[0] + value;
      try {
        localStorage.setItem(name, value);
      } catch (e) {
        localStorage.removeItem(name);
        sessionStorage.setItem(name, value);
        throw e;
      }
    };
  }
}
