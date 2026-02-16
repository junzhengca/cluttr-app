import { all, fork } from 'redux-saga/effects';
import { authSaga } from './authSaga';
import { settingsSaga } from './settingsSaga';
import { todoSaga } from './todoSaga';
import { inventorySaga } from './inventorySaga';
import { inventoryCategorySaga } from './inventoryCategorySaga';
import { locationSaga } from './locationSaga';

// Root saga that combines all sagas
export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(settingsSaga),
    fork(todoSaga),
    fork(inventorySaga),
    fork(inventoryCategorySaga),
    fork(locationSaga),
  ]);
}

