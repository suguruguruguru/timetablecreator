// Vueの要素指定
const vueApp = new Vue({
    el: '#app',
    data: {
        inputValue: '',
        artists: [],
        startTimeValue: '18:00',
        performTimeValue: '00:30',
        switchTimeValue: '00:10',
        eventTitle: 'Sample Event vol.1',
        textData: '',
        showHeader: false,
        isSpMode: false
    },
    methods: {
        /**
         * @method 演者を追加する
         */
        addArtist: function () {
            // console.log('addArtist')
            this.inputValue = this.inputValue.trim();
            if (this.inputValue.length > 100) {
                // 文字数多すぎ系
                vueApp.showErrorMessage('文字数多すぎです', '見にくくなるし100文字以内にしとこうね')
            } else if (this.inputValue.length > 0) {
                // 項目数チェック
                if(this.artists.length > 50) {
                    vueApp.showErrorMessage('項目数多すぎです', '50項目以内にしとこうね')
                }
                // 項目追加
                this.artists.push({
                    name: this.inputValue,
                    time: this.calcActTime(this.startTimeValue, this.performTimeValue, this.switchTimeValue, this.artists.length, true),
                    endTime: this.calcActTime(this.startTimeValue, this.performTimeValue, this.switchTimeValue, this.artists.length, false)
                });
                this.inputValue = '';
            } else {
                // 空欄系
                vueApp.showErrorMessage('空欄やん', 'なんか書いて追加してや')
            }
            this.createTextData();
            localStorage.setItem('artists', JSON.stringify(this.artists));
        },

        /**
         * @method 演者を削除する
         */
        deleteArtist: function (index) {
            //演者を削除する
            this.artists.splice(index, 1);
            this.resetActTime();
        },

        /**
         * @method 開始時間をセット
         */
        setStartTime: function () {
            // console.log('setStartTime', this.startTimeValue)
            if (this.artists !== null) {
                if (this.startTimeValue !== '') {
                    // アーティスト一覧の先頭(スタート時刻)を削除
                    this.artists.splice(0, 1);
                    this.artists.unshift({time: this.startTimeValue, name: '(イベント・リハーサルスタート)', endTime: ''});
                } else {
                    this.artists[0].time = this.startTimeValue;
                }
                // 全演者の開始、終了時間を再計算
                this.resetActTime();
            }
        },

        /**
         * @method 項目の開始・終了時刻を算出
         * @param startTime 全体のスタート時刻
         * @param performTime 演奏時間
         * @param switchTime 転換時間
         * @param index 出演順
         * @param calcStart 開始時刻を求める場合はtrue 終了時刻を求める場合はfalse
         * @return 演奏開始時刻
         */
        calcActTime: function(startTime, performTime, switchTime, index, calcStart) {
            this.startTimeValue = this.timeFormatChecker(startTime);
            this.performTimeValue = this.timeFormatChecker(performTime);
            this.switchTimeValue = this.timeFormatChecker(switchTime);
            let resultTime = '';
            if (startTime) {
                if (index === 0) {
                    resultTime = startTime;
                } else if (this.artists[index - 1].time !== null) {
                    performTime = performTime.split(':');
                    switchTime = switchTime.split(':');

                    let dateTime = new Date();

                    let lastArtistStartTime = this.artists[index - 1].time.split(':');

                    if (calcStart) {
                        // 開始時刻を求める
                        if (index === 1) {
                            // 1バンド目は企画開始時刻と同じ
                            resultTime = startTime;
                        } else {
                            // 2バンド目以降の演奏開始時刻＝前のバンドの開始時刻＋演奏時間＋転換時間
                            dateTime.setHours(+lastArtistStartTime[0] + +performTime[0] + +switchTime[0]);
                            dateTime.setMinutes(+lastArtistStartTime[1] + +performTime[1] + +switchTime[1]);
                            resultTime = ('0' + dateTime.getHours()).slice(-2) + ':' + ('0' + dateTime.getMinutes()).slice(-2);
                        }
                    } else {
                        // 終了時刻を求める
                        if (index === 1) {
                            // 1バンド目は企画開始時刻＋演奏時間
                            dateTime.setHours(+lastArtistStartTime[0] + +performTime[0]);
                            dateTime.setMinutes(+lastArtistStartTime[1] + +performTime[1]);
                        } else {
                            // 2バンド目以降の演奏終了時刻＝前のバンドの開始時刻＋演奏時間(前のバンド終了)＋転換時間+演奏時間
                            dateTime.setHours(+lastArtistStartTime[0] + +performTime[0] + +switchTime[0] + +performTime[0]);
                            dateTime.setMinutes(+lastArtistStartTime[1] + +performTime[1] + +switchTime[1] + +performTime[1]);
                        }
                        resultTime = ('0' + dateTime.getHours()).slice(-2) + ':' + ('0' + dateTime.getMinutes()).slice(-2);
                    }
                }
            }
            return resultTime;
        },

        /**
         * @method アーティスト削除や時刻変更があった際、表示しているタイムテの時間を再描画
         */
        resetActTime: function() {
            for(let i = 0; i < this.artists.length; i++) {
                if (i !== 0) {
                    this.artists[i].time = this.calcActTime(this.startTimeValue, this.performTimeValue, this.switchTimeValue, i, true);
                    this.artists[i].endTime = this.calcActTime(this.startTimeValue, this.performTimeValue, this.switchTimeValue, i, false);
                }
            }
            localStorage.setItem('artists', JSON.stringify(this.artists));
            this.createTextData();
        },

        /**
         * @method 順番入れ替え
         * @param index 入れ替えるアーティストの行番号
         * @param up 上に移動するかどうか
         */
        changeOrder: function(index, up) {
            let moveRow;
            let movedRow;
            moveRow = this.artists[index];
            if (up && index !== 1) {
                movedRow = this.artists[index - 1];
                this.artists.splice(index - 1, 2, moveRow, movedRow)
            } else if (!up && index !== this.artists.length - 1) {
                movedRow = this.artists[index + 1];
                this.artists.splice(index, 2, movedRow, moveRow)
            }
            this.resetActTime();
        },

        /**
         * @method LocalStorageにあるデータを読み込む
         */
        loadStorageData: function() {
            // イベントの情報を読み込む
            let eventInfoStr = localStorage.getItem('eventInfo');
            if (eventInfoStr !== null) {
                let eventJson = JSON.parse(eventInfoStr);
                // console.log(eventJson);
                this.eventTitle = eventJson.eventTitle;
                this.startTimeValue = eventJson.startTimeValue;
                this.performTimeValue = eventJson.performTimeValue;
                this.switchTimeValue = eventJson.switchTimeValue;
                this.textData = eventJson.textData;
                $("#start_time_input").val(eventJson.startTimeValue);
                $("#perform_time_input").val(eventJson.performTimeValue);
                $("#switch_time_input").val(eventJson.switchTimeValue);
                $('select').material_select();
            }
            // アーティスト一覧を読み込む
            let savedArtists = localStorage.getItem('artists');
            if (savedArtists !== null) {
                this.artists = JSON.parse(savedArtists);
            }
        },

        /**
         * @method タイムテーブルをテキストに整形してtextareaへ
         */
        createTextData: function() {
            if (this.artists.length > 0) {
                let resultTextData = '';

                // 開始時刻-終了時刻 なまえ 改行 でループ
                this.artists.forEach(function(v) {
                    resultTextData = resultTextData+v.time+'-'+v.endTime+' '+v.name+'\r\n';
                });

                // 企画名をくっつけてかんせー
                this.textData = '"'+this.eventTitle+'"\r\n\r\n'+resultTextData;
            }
            this.saveEventInfo();
        },

        /**
         * @method 成功時の通知を表示する
         */
        showSuccessMessage: function(titleStr, messageStr) {
            this.$notify.success({
                title: titleStr,
                message: messageStr
            });
        },

        /**
         * @method エラー時の通知を表示する
         */
        showErrorMessage: function(titleStr, messageStr) {
            this.$notify.error({
                title: titleStr,
                message: messageStr
            });
        },


        /**
         * @method イベントの情報をlocalStorageに入れる
         */
        saveEventInfo: function() {
            let eventInfo = {
                eventTitle: this.eventTitle,
                startTimeValue: this.startTimeValue,
                performTimeValue: this.performTimeValue,
                switchTimeValue: this.switchTimeValue,
                textData: this.textData
            };
            localStorage.setItem('eventInfo', JSON.stringify(eventInfo));
            // // console.log('Changes has been saved.');
        },

        /**
         * @method timePickerの入力値がおかしかったら00:00にする
         * @param str
         * @returns {*}
         */
        timeFormatChecker: function(str) {
            if(str.length < 5) {
                str = '00:00';
            }
            return str;
        },

        /**
         * @method 全入力内容のリセット
         */
        resetAllData: function() {
            // console.log('resetAll')
            // うん が押されたときの処理
            this.artists = [];
            this.eventTitle = '';
            this.startTimeValue = '18:00',
            this.performTimeValue = '00:30',
            this.switchTimeValue = '00:10',
            this.eventTitle = '',
            this.textData = '',
            localStorage.clear('eventTitle');
            localStorage.clear('artists');
            this.setStartTime();
            vueApp.showSuccessMessage('リセットしました…', '最初からやり直してください…');
            // console.log(this.artists);
        },

        /**
         * @method excel出力
         */
        downloadExcel: function() {
            let fileName = this.eventTitle.trim() !== '' ?  this.eventTitle : 'timetable';
            let opts = [{sheetid:'One',header:true}];
            let res = alasql('SELECT * INTO XLSX("' + fileName  + '.xlsx",?) FROM ?', [opts,[this.artists]]);
        }
    },
    mounted: function () {
        // 保存されているデータがあれば適用する
        if (localStorage.getItem('eventInfos') !== null || localStorage.getItem('artists') !== null) {
            this.loadStorageData();
        } else {
            this.setStartTime();
        }

        // Clipboard.js用
        let clipboard = new Clipboard('#copy_btn');
        clipboard.on('success', function(e) {
            e.clearSelection();
            // コピーした旨のメッセージ表示
            vueApp.showSuccessMessage('やったでおい', 'タイムテをクリップボードにコピーしました！！！');
        });

        // スクロール量監視
        window.onscroll = function() {
            if (window.pageYOffset > 300) {
                vueApp.showHeader = true;
            } else {
                vueApp.showHeader = false;
            }
        };
  
        if (window.innerWidth < 600) {
            this.isSpMode = true;
        }
        window.onresize = function() {
            if (window.innerWidth < 600) {
                vueApp.isSpMode = true;
            } else {
                vueApp.isSpMode = false;
            }
            // // console.log(this.isSpMode);
        };
        
        $(function() {
            // selectタグ用
            $('select').material_select();
            $('#start_time_input').on('change', function() {
                vueApp.startTimeValue = $('#start_time_input').val();
                vueApp.setStartTime();
            });
            $('#perform_time_input').on('change', function() {
                vueApp.performTimeValue = $('#perform_time_input').val();
                vueApp.resetActTime();
            });
            $('#switch_time_input').on('change', function() {
                vueApp.switchTimeValue = $('#switch_time_input').val();
                vueApp.resetActTime();
            });

            // modal用
            $('.modal').modal();
          });
    }
});
