import { Clipboard } from 'react-native';
import { download } from '../helpers';
import { observable } from 'mobx';
import store from '../store';

class ActionsSettings {
  constructor() {
    this.setupDragNDrop();
  }

  goToSettings() {
    store.settings.routeTab = 'Settings';
    store.save();
  }
  goToPublic() {
    store.settings.routeTab = 'Public';
    store.save();
  }
  goToPrivate() {
    store.settings.routeTab = 'Private';
    store.save();
  }
  goToHistory() {
    store.settings.routeTab = 'History';
    store.save();
  }

  setupDragNDrop() {
    const appRoot = document.getElementById('root');

    appRoot.addEventListener(
      'dragover',
      e => {
        e.stopPropagation();
        e.preventDefault();
      },
      false
    );
    appRoot.addEventListener(
      'drop',
      e => {
        e.stopPropagation();
        e.preventDefault();

        try {
          const file = e.dataTransfer.files[0];
          const reader = new FileReader();
          reader.onload = event => {
            console.log('onload', event.target.result);
            if (store.settings.publicSeed) {
              this.downloadBackup();
            }
            this.setBackup(event.target.result);
          };
          reader.readAsText(file);
        } catch (err) {
          console.log('Could not read file', err);
          alert('Could not read file');
        }
      },
      false
    );
  }

  prepareBackup() {
    let string;
    store.settings.lastBackup = new Date().getTime();
    store.save();
    const { settings, completedRounds } = store;
    try {
      string = JSON.stringify({ settings, completedRounds });
    } catch (err) {
      console.log('Could not copy all data', err);
      try {
        string = JSON.stringify({ settings });
      } catch (err) {
        console.log('Could not copy all data', err);
        alert('Could not create backup');
      }
    }
    return string;
  }

  copyBackup() {
    const string = this.prepareBackup();
    Clipboard.setString(string);
  }
  downloadBackup() {
    const string = this.prepareBackup();
    download(string);
  }
  async setBackup(backup) {
    try {
      const { settings, completedRounds } = JSON.parse(backup);
      if (!settings.publicSeed || !settings.privateSeed) {
        throw new Error('Missing wallet seeds');
      }
      store.settings = settings;
      store.settings.routeTab = 'Public';
      await store.save();
      store.completedRounds = observable.array(completedRounds || []);
      await store.saveRounds();
      store.route = 'Home';
      store.loaded = false;
      setTimeout(() => {
        store.loaded = true;
      }, 50);
      // window.location.reload();
    } catch (err) {
      console.log('Error recovering backup', err);
      alert('Could not load backup');
    }
  }
}

export default new ActionsSettings();
