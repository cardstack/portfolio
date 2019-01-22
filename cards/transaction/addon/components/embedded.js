import TransactionBaseMixin from '../mixins/transaction-base';
import Component from '@ember/component';
import layout from '../templates/embedded';

export default Component.extend(TransactionBaseMixin, { layout });