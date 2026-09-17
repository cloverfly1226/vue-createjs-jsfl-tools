declare namespace anim {
  declare namespace MyRecordPanel {
    declare class _default extends createjs.MovieClip {
      boxMC: createjs.MovieClip & {
        scratchTab: createjs.MovieClip;
        chanceTab: createjs.MovieClip;
        prizeTab: createjs.MovieClip;
        scrollBoxMC: createjs.MovieClip & {
          barMC: createjs.MovieClip;
          contentMC: createjs.MovieClip;
        };
        noDataMC: createjs.MovieClip;
      };
      backButton: createjs.MovieClip;
    }

    declare class PrizeItem6 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem8 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem7 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem9 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem1 extends createjs.MovieClip {
      prizeImageMC: createjs.MovieClip;
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem2 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem3 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem4 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class PrizeItem5 extends createjs.MovieClip {
      timeTXT: createjs.Text;
      button: createjs.MovieClip;
    }
    declare class ChanceItem extends createjs.MovieClip {
      descTXT: createjs.Text;
      timeTXT: createjs.Text;
    }
    declare class ScratchItem extends createjs.MovieClip {
      timeTXT: createjs.Text;
    }

  }

  declare interface Lib {
    MyRecordPanel: {
      MyRecordPanel: typeof MyRecordPanel._default;
      PrizeItem6: typeof MyRecordPanel.PrizeItem6;
      PrizeItem8: typeof MyRecordPanel.PrizeItem8;
      PrizeItem7: typeof MyRecordPanel.PrizeItem7;
      PrizeItem9: typeof MyRecordPanel.PrizeItem9;
      PrizeItem1: typeof MyRecordPanel.PrizeItem1;
      PrizeItem2: typeof MyRecordPanel.PrizeItem2;
      PrizeItem3: typeof MyRecordPanel.PrizeItem3;
      PrizeItem4: typeof MyRecordPanel.PrizeItem4;
      PrizeItem5: typeof MyRecordPanel.PrizeItem5;
      ChanceItem: typeof MyRecordPanel.ChanceItem;
      ScratchItem: typeof MyRecordPanel.ScratchItem;
    }
  }
}
