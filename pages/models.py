# -*- coding: utf-8 -
#
# This file is part of pages released under the MIT license. 
# See the NOTICE for more information.

from datetime import datetime

from couchdbkit.ext.django.schema import Document, DateTimeProperty

class DocRev(Document):
    """ document with revisions """
    created = DateTimeProperty()
    updated = DateTimeProperty()
    
    def save(self, **params):
        self.created = datetime.utcnow()
        
        if not self._rev:
            self.created = datetime.utcnow()
        self.updated = datetime.utcnow()
        
        super(DocRev, self).save(**params)
        
        # add a revision
        attachment_name = "rev_%s" % self._doc['updated']
        self.put_attachment(json.dumps(self.to_json()), attachment_name, 
                        content_type="application/json")


class Type(DocRev):
    
    @classmethod
    def all(cls):
        return cls.view("pages/all_types", include_docs=True)

    @classmethod
    def by_name(cls, name):
        return cls.view("pages/type_by_name", key=name,
                include_docs=True).one()

class Page(DocRev):

    @classmethod    
    def from_path(cls, path):
        key = path.split('/')
        res = cls.view("pages/from_path", key=key, 
                    include_docs=True).first()
        return res

    @classmethod
    def by_type(cls, tid):
        return cls.view("pages/by_type", key=tid, 
                    include_docs=True)
