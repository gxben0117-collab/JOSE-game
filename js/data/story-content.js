/* 章節敘事資料：舞台程式只讀取 scene，後續章節可直接追加同格式資料。 */
(function (global) {
  'use strict';
  global.JOSE_STORY_CONTENT = {
    scenes: {
      'c1-1:before': {
        kicker: '第一章｜幻獸初醒', title: '苔光中的求救訊號',
        speaker: '赤炎神龍', portrait: 'crimson_dragon',
        copy: '霧林深處傳來微弱的呼救。黑霧正在吞沒森林的記憶——先替我打開前哨的路。'
      },
      'c1-4:before': {
        kicker: '第一章｜林間追蹤', title: '被折斷的鹿角印記',
        speaker: '葉耳兔', portrait: 'leaf_ear_rabbit',
        copy: '這些露珠被污染了……但我還感覺得到一位森靈的氣息。牠正在等我們。'
      },
      'c1-7:before': {
        kicker: '第一章｜深入迷霧', title: '守林者的殘響',
        speaker: '赤炎神龍', portrait: 'crimson_dragon',
        copy: '那不是陷阱，是求救留下的引路火。別讓黑霧先一步抵達古樹祭壇。'
      },
      'c1-boss:before': {
        kicker: '第一章｜首領戰', title: '枯木王座',
        speaker: '森靈鹿', portrait: 'forest_deer',
        copy: '請小心……腐化之王把我的生命脈絡綁進祭壇。只要打破它，森林還有重生的機會！'
      },
      'c1-boss:after': {
        kicker: '第一章｜救援成功', title: '森靈鹿加入隊伍',
        speaker: '森靈鹿', portrait: 'forest_deer',
        copy: '謝謝你們。讓我把森林的露水帶上旅途吧——下一道裂縫，正通往潮汐遺跡。',
        rewardKey: 'c1-rescue-forest-deer', rewardPet: 'forest_deer'
      }
    },
    sceneFor: function (stageId, timing) { return this.scenes[stageId + ':' + timing] || null; }
  };
}(window));
